// ─────────────────────────────────────────────────────────────────────────────
// Dictionnaire de traduction FR / العربية
// Ajoute simplement de nouvelles clés ici puis utilise t("ma.cle") dans tes pages.
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "fr" | "ar";

export const translations = {
  fr: {
    // ── Navigation (sidebar) ──────────────────────────────────────────────
    nav: {
      dashboard: "Tableau de bord",
      decisions: "Décisions juridiques",
      articles: "Articles de loi",
      chat: "Assistant IA",
      contractGen: "Générateur de contrat",
      contractAnalysis: "Analyse de contrat",
      documents: "Mes documents",
      notifications: "Notifications",
      contracts: "Mes contrats",
      taxSim: "Simulateur fiscal",
      taxAdmin: "Veille fiscale",
      profile: "Mon profil",
      logout: "Déconnexion",
    },
    navbar: {
      search: "Rechercher une décision, un article ou un document…",
      role: "Avocat",
    },
    common: {
      login: "Connexion",
      register: "Créer un compte",
      tryFree: "Essayer gratuitement",
      backHome: "Retour à l'accueil",
      langName: "العربية", // étiquette du bouton = la langue VERS laquelle on bascule
    },

    // ── Landing page ──────────────────────────────────────────────────────
    landing: {
      eyebrow: "Plateforme B2B · Maroc",
      heroPre: "L'expertise juridique de votre PME, ",
      heroHl: "en quelques secondes",
      heroPost: ".",
      lead:
        "Mizan répond à vos questions de droit des affaires, du travail et fiscal — sourcées sur le Bulletin Officiel et les codes marocains. Pensé pour les dirigeants, RH et comptables des PME.",
      ctaPrimary: "Démarrer l'essai gratuit",
      ctaSecondary: "Voir une démo",
      reassure:
        "Réponses sourcées et vérifiables · Données hébergées au Maroc (Loi 09-08)",

      assistantTitle: "Mizan · Assistant Juridique",
      online: "en ligne",
      demoQuestion: "Quel est le délai de préavis pour licencier un cadre en CDI ?",
      demoAnswer:
        "D'après le Code du Travail (Loi 65-99), le préavis d'un cadre dépend de son ancienneté : il peut atteindre 3 mois au-delà de 5 ans de service. Le contrat ou la convention collective peut prévoir un délai plus favorable.",
      demoInput: "Posez votre question juridique…",

      sourcesLabel: "Sourcé sur",
      sources: [
        "Bulletin Officiel",
        "Code du Travail",
        "Code de Commerce",
        "Code Général des Impôts",
        "CNSS",
        "Data.gov.ma",
      ],

      featKicker: "Fonctionnalités",
      featTitle: "Un cabinet juridique dans votre navigateur",
      featSub:
        "Les usages qui couvrent le quotidien juridique d'une PME marocaine, sans jargon et sans honoraires à l'heure.",
      features: [
        {
          t: "Assistant juridique sourcé",
          d: "Posez vos questions en arabe, français ou darija : réponse claire avec l'article de loi et la décision de justice exacts.",
        },
        {
          t: "Analyse & score de contrats",
          d: "Importez un PDF ou Word : score de solidité, clauses présentes/manquantes, risques et rapport PDF détaillé.",
        },
        {
          t: "Génération de contrats",
          d: "Créez baux, contrats de travail et commerciaux conformes au droit marocain, prêts à signer.",
        },
        {
          t: "Simulateur fiscal",
          d: "Calculez IS, TVA, CNSS et IR selon la Loi de Finances en vigueur, avec projection annuelle.",
        },
        {
          t: "Veille fiscale & réglementaire",
          d: "Soyez alerté dès qu'un nouveau barème ou Bulletin Officiel touche votre activité.",
        },
        {
          t: "Mode vocal & bilingue",
          d: "Dictez vos questions et écoutez les réponses, en arabe comme en français.",
        },
      ],

      howKicker: "Comment ça marche",
      howTitle: "De la question à la décision, en trois temps",
      steps: [
        {
          t: "Posez votre question",
          d: "En langage courant. Mizan comprend le contexte de votre PME.",
        },
        {
          t: "Recevez une réponse sourcée",
          d: "Réponse claire, avec les articles de loi cités et le lien vers le texte officiel.",
        },
        {
          t: "Agissez et documentez",
          d: "Générez le document nécessaire, exportez-le et conservez l'historique pour vos audits.",
        },
      ],

      covKicker: "Sources juridiques",
      covTitle: "Chaque réponse remonte à un texte officiel",
      covSub:
        "Mizan ne devine pas : il cite. Le corpus est mis à jour à chaque parution du Bulletin Officiel.",
      coverage: [
        { t: "Code du Travail (Loi 65-99)", d: "Contrats, congés, licenciement, période d'essai" },
        { t: "Code de Commerce & sociétés", d: "SARL, SA, registre du commerce, baux commerciaux" },
        { t: "Code Général des Impôts & CNSS", d: "IS, IR, TVA, cotisations sociales et déclarations" },
        { t: "Loi 09-08 & données ouvertes", d: "Protection des données personnelles · Data.gov.ma" },
      ],

      priceKicker: "Tarifs",
      priceTitle: "Une formule pour chaque taille de PME",
      priceSub:
        "Sans engagement. Annulez quand vous voulez. Facturation en dirhams, conforme à la TVA marocaine.",
      mostChosen: "Le plus choisi",
      perMonth: "MAD / mois",
      plans: [
        {
          name: "Découverte",
          price: "0",
          unit: "MAD",
          desc: "Pour tester l'assistant sur vos premières questions.",
          cta: "Créer un compte",
          features: ["10 questions / mois", "Réponses sourcées", "1 utilisateur"],
        },
        {
          name: "PME",
          price: "799",
          unit: "MAD / mois",
          desc: "L'essentiel juridique pour une équipe qui avance.",
          cta: "Démarrer l'essai",
          features: [
            "Questions illimitées (réponses sourcées)",
            "Analyse & score de contrats + rapport PDF",
            "Génération de contrats & lettres",
            "Simulateur fiscal (IS, TVA, CNSS, IR)",
            "Veille du Bulletin Officiel",
            "Mode vocal & traduction AR/FR",
            "Jusqu'à 5 utilisateurs",
          ],
        },
        {
          name: "Entreprise",
          price: "Sur devis",
          unit: "",
          desc: "Pour cabinets, groupes et fonctions juridiques internes.",
          cta: "Nous contacter",
          features: [
            "Tout le plan PME",
            "Espace de travail partagé",
            "API & intégrations",
            "Accompagnement dédié",
          ],
        },
      ],

      finaleTitle: "Donnez à votre PME une longueur d'avance juridique",
      finaleSub:
        "Rejoignez les dirigeants marocains qui sécurisent leurs décisions sans attendre un rendez-vous.",
      finaleCta: "Démarrer gratuitement",
      finaleCta2: "Demander une démo",

      footDesc:
        "L'assistant juridique intelligent des PME marocaines. Sourcé, bilingue, hébergé au Maroc.",
      footProduct: "Produit",
      footCompany: "Société",
      footLegal: "Légal",
      footRights: "Tous droits réservés",
      footMade: "Conçu au Maroc",
      footLinks: {
        features: "Fonctionnalités",
        pricing: "Tarifs",
        sources: "Sources",
        demo: "Démo",
        about: "À propos",
        contact: "Contact",
        blog: "Blog juridique",
        legal: "Mentions légales",
        privacy: "Confidentialité (Loi 09-08)",
        terms: "CGU",
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  ar: {
    nav: {
      dashboard: "لوحة التحكم",
      decisions: "القرارات القضائية",
      articles: "الفصول القانونية",
      chat: "المساعد الذكي",
      contractGen: "منشئ العقود",
      contractAnalysis: "تحليل العقود",
      documents: "وثائقي",
      notifications: "الإشعارات",
      contracts: "عقودي",
      taxSim: "محاكي الضرائب",
      taxAdmin: "اليقظة الجبائية",
      profile: "ملفي الشخصي",
      logout: "تسجيل الخروج",
    },
    navbar: {
      search: "ابحث عن قرار أو فصل أو وثيقة…",
      role: "محامٍ",
    },
    common: {
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      tryFree: "جرّب مجاناً",
      backHome: "العودة إلى الرئيسية",
      langName: "Français",
    },

    landing: {
      eyebrow: "منصة B2B · المغرب",
      heroPre: "الخبرة القانونية لمقاولتك، ",
      heroHl: "في ثوانٍ معدودة",
      heroPost: ".",
      lead:
        "يجيب ميزان عن أسئلتكم في قانون الأعمال والشغل والضرائب — مع مصادر من الجريدة الرسمية والمدونات المغربية. مصمَّم لمسيّري المقاولات والموارد البشرية والمحاسبين.",
      ctaPrimary: "ابدأ التجربة المجانية",
      ctaSecondary: "شاهد عرضاً",
      reassure: "إجابات موثّقة وقابلة للتحقق · بيانات مستضافة بالمغرب (القانون 09-08)",

      assistantTitle: "ميزان · المساعد القانوني",
      online: "متصل",
      demoQuestion: "ما هو أجل الإشعار بالإقالة لإطار بعقد غير محدد المدة؟",
      demoAnswer:
        "حسب مدونة الشغل (القانون 65-99)، يتوقف أجل الإشعار بالنسبة للإطار على أقدميته: وقد يصل إلى 3 أشهر بعد 5 سنوات من الخدمة. ويمكن للعقد أو الاتفاقية الجماعية أن ينصّا على أجل أنسب.",
      demoInput: "اطرح سؤالك القانوني…",

      sourcesLabel: "مصادر من",
      sources: [
        "الجريدة الرسمية",
        "مدونة الشغل",
        "مدونة التجارة",
        "المدونة العامة للضرائب",
        "CNSS",
        "Data.gov.ma",
      ],

      featKicker: "المميزات",
      featTitle: "مكتب قانوني داخل متصفحك",
      featSub:
        "استعمالات تغطي اليومي القانوني للمقاولة المغربية، بدون تعقيد وبدون أتعاب بالساعة.",
      features: [
        { t: "مساعد قانوني موثّق", d: "اطرح أسئلتك بالعربية أو الفرنسية أو الدارجة: جواب واضح مع الفصل القانوني والقرار القضائي الدقيق." },
        { t: "تحليل وتنقيط العقود", d: "ارفع ملف PDF أو Word: درجة صلابة، بنود موجودة وناقصة، مخاطر، وتقرير PDF مفصّل." },
        { t: "إنشاء العقود", d: "أنشئ عقود الكراء والشغل والعقود التجارية مطابقة للقانون المغربي، جاهزة للتوقيع." },
        { t: "محاكي الضرائب", d: "احسب الضريبة على الشركات والقيمة المضافة و CNSS والدخل وفق قانون المالية، مع إسقاط سنوي." },
        { t: "اليقظة الجبائية والتشريعية", d: "كن على اطلاع فور تغيّر جدول ضريبي أو صدور جريدة رسمية تخص نشاطك." },
        { t: "الوضع الصوتي ثنائي اللغة", d: "أملِ أسئلتك واستمع إلى الأجوبة، بالعربية والفرنسية." },
      ],

      howKicker: "كيف يعمل",
      howTitle: "من السؤال إلى القرار، في ثلاث خطوات",
      steps: [
        { t: "اطرح سؤالك", d: "بلغة بسيطة. يفهم ميزان سياق مقاولتك." },
        { t: "احصل على جواب موثّق", d: "جواب واضح مع الفصول القانونية المُستشهد بها ورابط النص الرسمي." },
        { t: "تصرّف ووثّق", d: "أنشئ الوثيقة اللازمة، صدّرها واحتفظ بالسجل لعمليات التدقيق." },
      ],

      covKicker: "المصادر القانونية",
      covTitle: "كل جواب يستند إلى نص رسمي",
      covSub: "ميزان لا يخمّن: بل يستشهد. تُحدَّث القاعدة مع كل إصدار للجريدة الرسمية.",
      coverage: [
        { t: "مدونة الشغل (القانون 65-99)", d: "العقود، العطل، التسريح، الفترة التجريبية" },
        { t: "مدونة التجارة والشركات", d: "ش.م.م، ش.م، السجل التجاري، الأكرية التجارية" },
        { t: "المدونة العامة للضرائب وCNSS", d: "الضريبة على الشركات والدخل والقيمة المضافة والاشتراكات" },
        { t: "القانون 09-08 والبيانات المفتوحة", d: "حماية المعطيات الشخصية · Data.gov.ma" },
      ],

      priceKicker: "الأسعار",
      priceTitle: "صيغة لكل حجم مقاولة",
      priceSub: "بدون التزام. ألغِ متى شئت. الفوترة بالدرهم، مطابقة للضريبة على القيمة المضافة المغربية.",
      mostChosen: "الأكثر اختياراً",
      perMonth: "درهم / شهر",
      plans: [
        {
          name: "اكتشاف",
          price: "0",
          unit: "درهم",
          desc: "لتجربة المساعد على أسئلتك الأولى.",
          cta: "إنشاء حساب",
          features: ["10 أسئلة / شهر", "إجابات موثّقة", "مستخدم واحد"],
        },
        {
          name: "مقاولة",
          price: "799",
          unit: "درهم / شهر",
          desc: "الأساسي القانوني لفريق يتقدّم.",
          cta: "ابدأ التجربة",
          features: [
            "أسئلة غير محدودة (إجابات موثّقة)",
            "تحليل وتنقيط العقود + تقرير PDF",
            "إنشاء العقود والرسائل",
            "محاكي الضرائب (IS، TVA، CNSS، IR)",
            "يقظة الجريدة الرسمية",
            "الوضع الصوتي وترجمة عربي/فرنسي",
            "حتى 5 مستخدمين",
          ],
        },
        {
          name: "مؤسسة",
          price: "حسب الطلب",
          unit: "",
          desc: "للمكاتب والمجموعات والوظائف القانونية الداخلية.",
          cta: "اتصل بنا",
          features: ["كل صيغة المقاولة", "مساحة عمل مشتركة", "واجهة برمجية وتكاملات", "مواكبة مخصّصة"],
        },
      ],

      finaleTitle: "امنح مقاولتك تقدّماً قانونياً",
      finaleSub: "انضم إلى المسيّرين المغاربة الذين يؤمّنون قراراتهم دون انتظار موعد.",
      finaleCta: "ابدأ مجاناً",
      finaleCta2: "اطلب عرضاً",

      footDesc: "المساعد القانوني الذكي للمقاولات المغربية. موثّق، ثنائي اللغة، مستضاف بالمغرب.",
      footProduct: "المنتج",
      footCompany: "الشركة",
      footLegal: "قانوني",
      footRights: "جميع الحقوق محفوظة",
      footMade: "صُمِّم في المغرب",
      footLinks: {
        features: "المميزات",
        pricing: "الأسعار",
        sources: "المصادر",
        demo: "عرض",
        about: "من نحن",
        contact: "اتصال",
        blog: "مدونة قانونية",
        legal: "إشعارات قانونية",
        privacy: "الخصوصية (القانون 09-08)",
        terms: "شروط الاستعمال",
      },
    },
  },
} as const;
