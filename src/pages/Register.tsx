import {
  useState,
  type ChangeEvent,
  type FormEvent,
  } from "react";
  import { Link, useNavigate } from "react-router-dom";
  
  import api, { ApiError } from "../services/apiClient";
  import { useLang } from "../i18n/LanguageContext";
  import AuthShell from "../components/AuthShell";
  
  type CompanyInfo = {
  rc_number: string;
  rc_city: string;
  company_name: string;
  status: string;
  };
  
  type ApiResponse = {
  success?: boolean;
  message?: string;
  verified?: boolean;
  company?: CompanyInfo;
  
  data?: {
  success?: boolean;
  message?: string;
  verified?: boolean;
  company?: CompanyInfo;
  
  
  data?: {
    success?: boolean;
    message?: string;
    verified?: boolean;
    company?: CompanyInfo;
  };
  
  
  };
  };
  
  function extractCompany(response: unknown): CompanyInfo | null {
  const value = response as ApiResponse;
  
  return (
  value?.company ??
  value?.data?.company ??
  value?.data?.data?.company ??
  null
  );
  }
  
  function extractVerified(response: unknown): boolean | undefined {
  const value = response as ApiResponse;
  
  return (
  value?.verified ??
  value?.data?.verified ??
  value?.data?.data?.verified
  );
  }
  
  function extractSuccess(response: unknown): boolean | undefined {
  const value = response as ApiResponse;
  
  return (
  value?.success ??
  value?.data?.success ??
  value?.data?.data?.success
  );
  }
  
  function extractMessage(response: unknown): string | null {
  const value = response as ApiResponse;
  
  return (
  value?.message ??
  value?.data?.message ??
  value?.data?.data?.message ??
  null
  );
  }
  
  export default function Register() {
  const navigate = useNavigate();
  const { t } = useLang();
  
  /*
  
  * La langue est détectée à partir du LanguageContext.
  * Elle reste donc correcte après une navigation entre les pages.
    */
    const translatedRegisterTitle = t("auth.register.title");
  
  const isArabic = /[\u0600-\u06FF]/.test(
  translatedRegisterTitle
  );
  
  const text = (
  french: string,
  arabic: string
  ): string => {
  return isArabic ? arabic : french;
  };
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  
  const [rcNumber, setRcNumber] = useState("");
  const [rcCity, setRcCity] = useState("");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [company, setCompany] =
  useState<CompanyInfo | null>(null);
  
  const [rcVerified, setRcVerified] = useState(false);
  
  const [error, setError] =
  useState<string | null>(null);
  
  const [isVerifying, setIsVerifying] =
  useState(false);
  
  const [isRegistering, setIsRegistering] =
  useState(false);
  
  const [registered, setRegistered] =
  useState(false);
  
  const resetRcVerification = () => {
  setRcVerified(false);
  setCompany(null);
  };
  
  const handleRcNumberChange = (
  event: ChangeEvent<HTMLInputElement>
  ) => {
  setRcNumber(event.target.value);
  resetRcVerification();
  setError(null);
  };
  
  const handleRcCityChange = (
  event: ChangeEvent<HTMLInputElement>
  ) => {
  setRcCity(event.target.value);
  resetRcVerification();
  setError(null);
  };
  
  const getErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) {
  return translateServerError(err.message);
  }
  
  
  if (err instanceof Error) {
    return translateServerError(err.message);
  }
  
  return text(
    "Une erreur inattendue est survenue.",
    "حدث خطأ غير متوقع."
  );
  
  
  };
  
  const translateServerError = (
  message: string
  ): string => {
  if (!isArabic) {
  return message;
  }
  
  
  const normalizedMessage = message.toLowerCase();
  
  if (
    normalizedMessage.includes(
      "cet email est déjà utilisé"
    )
  ) {
    return "هذا البريد الإلكتروني مستخدم بالفعل.";
  }
  
  if (
    normalizedMessage.includes(
      "un compte existe déjà"
    )
  ) {
    return "يوجد حساب بالفعل لهذه الشركة ولهذا السجل التجاري.";
  }
  
  if (
    normalizedMessage.includes("email invalide")
  ) {
    return "البريد الإلكتروني غير صالح.";
  }
  
  if (
    normalizedMessage.includes(
      "entreprise introuvable"
    ) ||
    normalizedMessage.includes(
      "aucune entreprise"
    )
  ) {
    return "لم يتم العثور على شركة نشطة مطابقة لهذه المعلومات.";
  }
  
  if (
    normalizedMessage.includes(
      "mot de passe incorrect"
    )
  ) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  
  return message;
  
  
  };
  
  const handleVerifyRc = async () => {
  setError(null);
  resetRcVerification();
  
  
  const normalizedRc = rcNumber.trim();
  const normalizedCity = rcCity.trim();
  
  if (!normalizedRc) {
    setError(
      text(
        "Le numéro du registre de commerce est obligatoire.",
        "رقم السجل التجاري مطلوب."
      )
    );
    return;
  }
  
  if (!/^\d+$/.test(normalizedRc)) {
    setError(
      text(
        "Le numéro RC doit contenir uniquement des chiffres.",
        "يجب أن يحتوي رقم السجل التجاري على أرقام فقط."
      )
    );
    return;
  }
  
  if (!normalizedCity) {
    setError(
      text(
        "La ville du registre de commerce est obligatoire.",
        "مدينة السجل التجاري مطلوبة."
      )
    );
    return;
  }
  
  setIsVerifying(true);
  
  try {
    const response = await api.post(
      "/auth/verify-rc",
      {
        rc_number: normalizedRc,
        rc_city: normalizedCity,
      }
    );
  
    const foundCompany =
      extractCompany(response);
  
    const verified =
      extractVerified(response);
  
    const success =
      extractSuccess(response);
  
    const message =
      extractMessage(response);
  
    if (
      !foundCompany ||
      verified === false ||
      success === false
    ) {
      throw new Error(
        message ||
          text(
            "Aucune entreprise active ne correspond à ce RC et à cette ville.",
            "لا توجد شركة نشطة مطابقة لرقم السجل التجاري وهذه المدينة."
          )
      );
    }
  
    setCompany(foundCompany);
    setRcVerified(true);
  } catch (err) {
    setError(getErrorMessage(err));
    resetRcVerification();
  } finally {
    setIsVerifying(false);
  }
  
  
  };
  
  const handleSubmit = async (
  event: FormEvent
  ) => {
  event.preventDefault();
  setError(null);
  
  
  if (!fullName.trim()) {
    setError(
      text(
        "Le nom complet du responsable est obligatoire.",
        "الاسم الكامل لمسؤول الشركة مطلوب."
      )
    );
    return;
  }
  
  if (!email.trim()) {
    setError(
      text(
        "L’adresse email professionnelle est obligatoire.",
        "البريد الإلكتروني المهني مطلوب."
      )
    );
    return;
  }
  
  if (!rcVerified || !company) {
    setError(
      text(
        "Veuillez d’abord vérifier le registre de commerce.",
        "يرجى التحقق من السجل التجاري أولاً."
      )
    );
    return;
  }
  
  if (password.length < 8) {
    setError(
      text(
        "Le mot de passe doit contenir au moins 8 caractères.",
        "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
      )
    );
    return;
  }
  
  if (password !== confirmPassword) {
    setError(
      text(
        "Les mots de passe ne correspondent pas.",
        "كلمتا المرور غير متطابقتين."
      )
    );
    return;
  }
  
  setIsRegistering(true);
  
  try {
    const response = await api.post(
      "/auth/register",
      {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        rc_number: rcNumber.trim(),
        rc_city: rcCity.trim(),
      }
    );
  
    const success =
      extractSuccess(response);
  
    const message =
      extractMessage(response);
  
    if (success === false) {
      throw new Error(
        message ||
          text(
            "Impossible de créer le compte.",
            "تعذر إنشاء الحساب."
          )
      );
    }
  
    setRegistered(true);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setIsRegistering(false);
  }
  
  
  };
  
  if (registered) {
  return (
  <div dir={isArabic ? "rtl" : "ltr"}>
  <AuthShell
  title={text(
  "Compte créé",
  "تم إنشاء الحساب"
  )}
  icon="✅"
  centered
  > <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800"> <p className="font-semibold">
  {text(
  "L’entreprise a été vérifiée et le compte a été activé avec succès.",
  "تم التحقق من الشركة وتفعيل الحساب بنجاح."
  )} </p>
  
  
          {company && (
            <div className="mt-4 space-y-2">
              <div>
                <p className="text-xs font-medium text-green-700">
                  {text(
                    "Nom officiel de l’entreprise",
                    "الاسم الرسمي للشركة"
                  )}
                </p>
  
                <p className="font-semibold">
                  {company.company_name}
                </p>
              </div>
  
              <p className="text-sm">
                RC {company.rc_number} —{" "}
                {company.rc_city}
              </p>
            </div>
          )}
  
          <p className="mt-4 text-sm">
            {text(
              "Vous pouvez maintenant vous connecter directement.",
              "يمكنك الآن تسجيل الدخول مباشرة."
            )}
          </p>
        </div>
  
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="btn-primary w-full py-3"
        >
          {text(
            "Se connecter",
            "تسجيل الدخول"
          )}
        </button>
      </AuthShell>
    </div>
  );
  
  
  }
  
  return (
  <div dir={isArabic ? "rtl" : "ltr"}>
  <AuthShell
  title={text(
  "Créer un compte",
  "إنشاء حساب"
  )}
  subtitle={text(
  "Rejoignez Mizan — votre assistant juridique intelligent",
  "انضم إلى ميزان — مساعدك القانوني الذكي"
  )}
  >
  {error && ( <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
  {error} </div>
  )}
  
  
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div>
          <label className="label">
            {text(
              "Nom complet du responsable",
              "الاسم الكامل لمسؤول الشركة"
            )}
          </label>
  
          <input
            type="text"
            required
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            className="input"
            placeholder={text(
              "Mohammed El Amrani",
              "محمد العمراني"
            )}
            dir={isArabic ? "rtl" : "ltr"}
          />
        </div>
  
        <div>
          <label className="label">
            {text(
              "Email professionnel",
              "البريد الإلكتروني المهني"
            )}
          </label>
  
          <input
            type="email"
            required
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className="input"
            placeholder="entreprise@exemple.com"
            dir="ltr"
          />
        </div>
  
        <div>
          <label className="label">
            {text(
              "Numéro du registre de commerce",
              "رقم السجل التجاري"
            )}
          </label>
  
          <input
            type="text"
            inputMode="numeric"
            required
            value={rcNumber}
            onChange={handleRcNumberChange}
            className="input"
            placeholder="123456"
            dir="ltr"
          />
        </div>
  
        <div>
          <label className="label">
            {text(
              "Ville du registre de commerce",
              "مدينة السجل التجاري"
            )}
          </label>
  
          <input
            type="text"
            required
            value={rcCity}
            onChange={handleRcCityChange}
            className="input"
            placeholder={text(
              "Tanger",
              "طنجة"
            )}
            dir={isArabic ? "rtl" : "ltr"}
          />
        </div>
  
        <button
          type="button"
          onClick={handleVerifyRc}
          disabled={
            isVerifying ||
            !rcNumber.trim() ||
            !rcCity.trim()
          }
          className="btn-outline w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isVerifying
            ? text(
                "Vérification en cours...",
                "جاري التحقق..."
              )
            : text(
                "Vérifier le registre de commerce",
                "التحقق من السجل التجاري"
              )}
        </button>
  
        {rcVerified && company && (
          <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              ✅{" "}
              {text(
                "Entreprise vérifiée avec succès",
                "تم التحقق من الشركة بنجاح"
              )}
            </p>
  
            <div>
              <label className="label">
                {text(
                  "Nom officiel de l’entreprise",
                  "الاسم الرسمي للشركة"
                )}
              </label>
  
              <input
                type="text"
                value={company.company_name}
                disabled
                className="input cursor-not-allowed bg-white font-semibold text-green-800"
                dir={isArabic ? "rtl" : "ltr"}
              />
            </div>
  
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">
                  {text(
                    "RC vérifié",
                    "رقم السجل التجاري المؤكد"
                  )}
                </label>
  
                <input
                  type="text"
                  value={company.rc_number}
                  disabled
                  className="input cursor-not-allowed bg-white text-green-800"
                  dir="ltr"
                />
              </div>
  
              <div>
                <label className="label">
                  {text(
                    "Ville vérifiée",
                    "المدينة المؤكدة"
                  )}
                </label>
  
                <input
                  type="text"
                  value={company.rc_city}
                  disabled
                  className="input cursor-not-allowed bg-white text-green-800"
                  dir={isArabic ? "rtl" : "ltr"}
                />
              </div>
            </div>
          </div>
        )}
  
        <div>
          <label className="label">
            {text(
              "Mot de passe",
              "كلمة المرور"
            )}
          </label>
  
          <input
            type="password"
            required
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            className="input"
            placeholder="••••••••"
            dir="ltr"
          />
  
          <p className="mt-1 text-xs text-gray-400">
            {text(
              "Minimum 8 caractères",
              "8 أحرف على الأقل"
            )}
          </p>
        </div>
  
        <div>
          <label className="label">
            {text(
              "Confirmer le mot de passe",
              "تأكيد كلمة المرور"
            )}
          </label>
  
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            className="input"
            placeholder="••••••••"
            dir="ltr"
          />
        </div>
  
        <button
          type="submit"
          disabled={
            isRegistering ||
            !rcVerified
          }
          className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRegistering
            ? text(
                "Création du compte...",
                "جاري إنشاء الحساب..."
              )
            : text(
                "Créer mon compte",
                "إنشاء حسابي"
              )}
        </button>
  
        {!rcVerified && (
          <p className="text-center text-xs text-gray-400">
            {text(
              "Vérifiez le registre de commerce pour activer le bouton d’inscription.",
              "تحقق من السجل التجاري لتفعيل زر إنشاء الحساب."
            )}
          </p>
        )}
      </form>
  
      <p className="mt-5 text-center text-sm text-gray-500">
        {text(
          "Vous avez déjà un compte ?",
          "لديك حساب بالفعل؟"
        )}{" "}
        <Link
          to="/login"
          className="font-medium text-mizan-600 hover:underline"
        >
          {text(
            "Se connecter",
            "تسجيل الدخول"
          )}
        </Link>
      </p>
    </AuthShell>
  </div>
  
  
  );
  }
  