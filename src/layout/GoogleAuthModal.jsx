// GoogleAuthModal.jsx
import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { XIcon } from "@heroicons/react/solid";

const GoogleAuthModal = ({ onClose }) => {
  const handleGoogleLogin = async (res) => {
    try {
      const token = res.credential;

      console.log("🔵 TOKEN GOOGLE:", token);

      const request = await fetch(
        "https://argames.store/api/api.php?endpoint=auth/google-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }
      );

      console.log("🟣 HTTP STATUS:", request.status);

      // Leer respuesta cruda siempre
      const raw = await request.text();
      console.log("🟡 RAW desde backend (texto literal):");
      console.log("────────────────────────────────────────");
      console.log(raw);
      console.log("────────────────────────────────────────");

      // Si la respuesta contiene HTML → error del servidor
      if (raw.includes("<br") || raw.includes("<html") || raw.includes("Warning") || raw.includes("Fatal")) {
        console.error("❌ Parece un error PHP, muestra HTML o warnings.");
        alert("Error interno: el servidor devolvió contenido inválido.");
        return;
      }

      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error("❌ No se pudo parsear JSON:");
        console.error(err);
        alert("El servidor devolvió un JSON inválido.");
        return;
      }

      console.log("🟢 JSON parseado correctamente:", data);

      if (data.error) {
        alert("⚠ " + data.error);
        return;
      }

      if (data.jwt) {
        console.log("🔐 JWT recibido:", data.jwt);

        localStorage.setItem("token", data.jwt);
        localStorage.setItem("user", JSON.stringify(data.user));

        onClose();
      }
    } catch (err) {
      console.error("🚨 ERROR GENERAL:", err);
      alert("Error inesperado iniciando sesión.");
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        className="bg-white rounded-xl p-6 shadow-lg relative w-[90%] max-w-md"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <button onClick={onClose} className="absolute top-3 right-3">
          <XIcon className="w-6 h-6 text-gray-600" />
        </button>

        <h2 className="text-2xl font-bold text-center text-[#c35fff] mb-4">
          Iniciar sesión con Google
        </h2>

        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => console.log("❌ Error Google Login")}
        />
      </motion.div>
    </motion.div>
  );
};

export default GoogleAuthModal;
