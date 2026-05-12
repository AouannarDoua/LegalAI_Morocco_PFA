import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../services/apiClient";

type Status = "loading" | "success" | "error";

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();
  const [status, setStatus]   = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token manquant ou invalide.");
      return;
    }

    const confirm = async () => {
      try {
        const data = await api.get<{ message: string }>(
          `/auth/confirm-email?token=${token}`
        );
        setStatus("success");
        setMessage("Votre email a été confirmé avec succès !");
        // Redirect vers login après 3 secondes
        setTimeout(() => navigate("/login", {
          state: { message: "Email confirmé ! Vous pouvez vous connecter." }
        }), 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Lien invalide ou expiré.");
      }
    };

    confirm();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">

        {/* Loading */}
        {status === "loading" && (
          <>
            <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Confirmation en cours...
            </h1>
            <p className="text-gray-500 text-sm">
              Veuillez patienter quelques secondes.
            </p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✅
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Email confirmé !
            </h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <p className="text-gray-400 text-xs mb-4">
              Redirection automatique vers la page de connexion...
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
            >
              Se connecter maintenant
            </Link>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ❌
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Confirmation échouée
            </h1>
            <p className="text-red-600 text-sm mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                to="/register"
                className="block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
              >
                Créer un nouveau compte
              </Link>
              <Link
                to="/login"
                className="block px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition"
              >
                Retour à la connexion
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}