# app/services/tax_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Simulateur fiscal marocain — calcule IS + TVA + CNSS + IR.
# Les barèmes ne sont PAS écrits en dur : ils sont chargés depuis
# backend/data/tax_rates.json, organisés par année. Pour mettre à jour
# l'application après une nouvelle Loi de Finances, il suffit d'ajouter
# (ou de corriger) un bloc d'année dans ce fichier JSON, SANS toucher au code.
# ─────────────────────────────────────────────────────────────────────────────
import os
import json


class TaxService:
    def __init__(self):
        # backend/app/services/tax_service.py -> remonte vers backend/data/
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.file_path = os.path.join(base_dir, "data", "tax_rates.json")
        self._config = None

    # ─── Chargement de la configuration ──────────────────────────────────────
    def _load(self) -> dict:
        if self._config is None:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self._config = json.load(f)
        return self._config

    def reload(self):
        """Force le rechargement du fichier (utile après une mise à jour)."""
        self._config = None
        return self._load()

    def available_years(self) -> list:
        cfg = self._load()
        return sorted(cfg.get("years", {}).keys(), reverse=True)

    def default_year(self) -> int:
        return int(self._load().get("default_year", 2026))

    def get_rates(self, year=None) -> dict:
        cfg = self._load()
        year = str(year or self.default_year())
        years = cfg.get("years", {})
        if year not in years:
            raise ValueError(f"Aucun barème disponible pour l'année {year}")
        return years[year]

    # ─── Helpers de calcul ───────────────────────────────────────────────────
    @staticmethod
    def _round(x: float) -> float:
        return round(float(x), 2)

    # ─── 1) Impôt sur les Sociétés (IS) ──────────────────────────────────────
    def _compute_is(self, rates, chiffre_affaires, benefice_net, secteur_financier):
        is_cfg = rates["is"]

        # Détermination du taux applicable (IS proportionnel : un seul taux sur tout le bénéfice)
        taux = is_cfg["tranches"][0]["taux"]
        tranche_label = is_cfg["tranches"][0]["label"]
        for t in is_cfg["tranches"]:
            borne_max = t["max"] if t["max"] is not None else float("inf")
            if t["min"] <= benefice_net < borne_max:
                taux = t["taux"]
                tranche_label = t["label"]
                break
        else:
            # bénéfice >= dernière borne min
            last = is_cfg["tranches"][-1]
            taux, tranche_label = last["taux"], last["label"]

        if secteur_financier:
            taux = is_cfg.get("taux_secteur_financier", taux)
            tranche_label = "Secteur financier (banques/assurances)"

        is_calcule = max(benefice_net, 0) * taux / 100

        # Cotisation minimale = max(0.25% du CA, 3000 DH). L'IS dû ne peut être inférieur.
        cm_cfg = is_cfg["cotisation_minimale"]
        cm = max(chiffre_affaires * cm_cfg["taux_ca"] / 100, cm_cfg["minimum"])
        is_du = max(is_calcule, cm)

        explication = (
            f"Taux applicable : {taux}% ({tranche_label}). "
            f"IS calculé = bénéfice {self._round(benefice_net):,.2f} x {taux}% = {self._round(is_calcule):,.2f} DH. "
            f"Cotisation minimale = max(0,25% x CA, 3 000 DH) = {self._round(cm):,.2f} DH. "
            f"IS dû = le plus élevé des deux = {self._round(is_du):,.2f} DH."
        ).replace(",", " ")

        return {
            "taux": taux,
            "tranche": tranche_label,
            "is_calcule": self._round(is_calcule),
            "cotisation_minimale": self._round(cm),
            "is_du": self._round(is_du),
            "explication": explication,
        }

    # ─── 2) TVA ──────────────────────────────────────────────────────────────
    def _compute_tva(self, rates, chiffre_affaires, taux_tva):
        tva_collectee = chiffre_affaires * taux_tva / 100
        explication = (
            f"TVA collectée estimée = CA {self._round(chiffre_affaires):,.2f} x {taux_tva}% "
            f"= {self._round(tva_collectee):,.2f} DH. "
            f"(La TVA réellement due = TVA collectée - TVA déductible sur les achats.)"
        ).replace(",", " ")
        return {
            "taux": taux_tva,
            "tva_collectee": self._round(tva_collectee),
            "explication": explication,
        }

    # ─── 3) CNSS (par employé puis total) ────────────────────────────────────
    def _compute_cnss(self, rates, salaire_brut_mensuel, nombre_employes):
        c = rates["cnss"]
        plafond = c["plafond_mensuel"]
        base_plafonnee = min(salaire_brut_mensuel, plafond)

        sal = c["salarie"]
        pat = c["patronal"]

        # Part salariale (retenue sur le bulletin de l'employé)
        sal_mensuel = (
            base_plafonnee * sal["cnss_plafonne"] / 100
            + salaire_brut_mensuel * sal["amo_non_plafonne"] / 100
        )
        # Part patronale (à la charge de l'entreprise)
        pat_mensuel = (
            base_plafonnee * pat["cnss_plafonne"] / 100
            + salaire_brut_mensuel * pat["non_plafonne"] / 100
        )

        sal_annuel_total = sal_mensuel * 12 * nombre_employes
        pat_annuel_total = pat_mensuel * 12 * nombre_employes
        total_annuel = sal_annuel_total + pat_annuel_total

        explication = (
            f"Par employé (brut {self._round(salaire_brut_mensuel):,.2f} DH/mois) : "
            f"part salariale {self._round(sal_mensuel):,.2f} DH/mois, "
            f"part patronale {self._round(pat_mensuel):,.2f} DH/mois. "
            f"Base CNSS plafonnée à {plafond:,.0f} DH ; AMO sans plafond. "
            f"x 12 mois x {nombre_employes} employé(s)."
        ).replace(",", " ")

        return {
            "par_employe_mensuel": {
                "salariale": self._round(sal_mensuel),
                "patronale": self._round(pat_mensuel),
            },
            "salariale_annuelle_totale": self._round(sal_annuel_total),
            "patronale_annuelle_totale": self._round(pat_annuel_total),
            "total_annuel": self._round(total_annuel),
            "_part_salariale_mensuelle": sal_mensuel,  # usage interne pour l'IR
            "explication": explication,
        }

    # ─── 4) IR (par employé puis total) ──────────────────────────────────────
    def _compute_ir(self, rates, salaire_brut_mensuel, nombre_employes, cnss_salariale_mensuelle):
        ir_cfg = rates["ir"]
        fp = ir_cfg["frais_professionnels"]

        brut_annuel = salaire_brut_mensuel * 12
        cnss_annuelle = cnss_salariale_mensuelle * 12

        # Frais professionnels (déduction forfaitaire)
        if brut_annuel <= fp["seuil_brut_annuel"]:
            frais_pro = min(brut_annuel * fp["taux_sous_seuil"] / 100, fp["plafond_sous_seuil"])
            taux_fp = fp["taux_sous_seuil"]
        else:
            frais_pro = min(brut_annuel * fp["taux_au_dessus"] / 100, fp["plafond_au_dessus"])
            taux_fp = fp["taux_au_dessus"]

        # Revenu Net Imposable
        rni = brut_annuel - cnss_annuelle - frais_pro
        rni = max(rni, 0)

        # Application du barème progressif
        taux = 0
        deduction = 0
        for t in ir_cfg["tranches"]:
            borne_max = t["max"] if t["max"] is not None else float("inf")
            if t["min"] <= rni < borne_max:
                taux, deduction = t["taux"], t["deduction"]
                break
        else:
            last = ir_cfg["tranches"][-1]
            taux, deduction = last["taux"], last["deduction"]

        ir_annuel = max(rni * taux / 100 - deduction, 0)
        ir_total = ir_annuel * nombre_employes

        explication = (
            f"Brut annuel/employé = {self._round(brut_annuel):,.2f} DH. "
            f"Frais professionnels ({taux_fp}%) = {self._round(frais_pro):,.2f} DH. "
            f"CNSS/AMO salariale = {self._round(cnss_annuelle):,.2f} DH. "
            f"RNI = {self._round(rni):,.2f} DH. "
            f"IR = (RNI x {taux}%) - {deduction:,.0f} = {self._round(ir_annuel):,.2f} DH/an/employé. "
            f"x {nombre_employes} employé(s)."
        ).replace(",", " ")

        return {
            "rni_annuel_par_employe": self._round(rni),
            "taux": taux,
            "ir_annuel_par_employe": self._round(ir_annuel),
            "ir_annuel_total": self._round(ir_total),
            "explication": explication,
        }

    # ─── Point d'entrée : simulation complète ────────────────────────────────
    def simulate(self, *, year=None, chiffre_affaires=0, benefice_net=0,
                 secteur="", nombre_employes=0, salaire_brut_mensuel=0,
                 taux_tva=20, secteur_financier=False) -> dict:

        rates = self.get_rates(year)
        year = str(year or self.default_year())

        chiffre_affaires     = max(float(chiffre_affaires or 0), 0)
        benefice_net         = float(benefice_net or 0)
        nombre_employes      = max(int(nombre_employes or 0), 0)
        salaire_brut_mensuel = max(float(salaire_brut_mensuel or 0), 0)
        taux_tva             = float(taux_tva or rates["tva"]["taux_normal"])

        is_res  = self._compute_is(rates, chiffre_affaires, benefice_net, secteur_financier)
        tva_res = self._compute_tva(rates, chiffre_affaires, taux_tva)

        if nombre_employes > 0 and salaire_brut_mensuel > 0:
            cnss_res = self._compute_cnss(rates, salaire_brut_mensuel, nombre_employes)
            ir_res   = self._compute_ir(rates, salaire_brut_mensuel, nombre_employes,
                                        cnss_res.pop("_part_salariale_mensuelle"))
        else:
            cnss_res = None
            ir_res   = None

        # Total des charges/impôts à la charge de l'ENTREPRISE
        total_entreprise = is_res["is_du"]
        if cnss_res:
            total_entreprise += cnss_res["patronale_annuelle_totale"]

        return {
            "meta": {
                "annee": int(year),
                "loi_finances": rates.get("loi_finances", ""),
                "source": rates.get("source", ""),
                "secteur": secteur,
            },
            "entrees": {
                "chiffre_affaires": self._round(chiffre_affaires),
                "benefice_net": self._round(benefice_net),
                "nombre_employes": nombre_employes,
                "salaire_brut_mensuel": self._round(salaire_brut_mensuel),
                "taux_tva": taux_tva,
                "secteur_financier": secteur_financier,
            },
            "is": is_res,
            "tva": tva_res,
            "cnss": cnss_res,
            "ir": ir_res,
            "totaux": {
                "total_charges_entreprise_annuel": self._round(total_entreprise),
                "note": "Total = IS dû + part patronale CNSS annuelle. La TVA est neutre pour l'entreprise (collectée puis reversée). L'IR est supporté par les employés (retenu à la source).",
            },
        }


tax_service = TaxService()