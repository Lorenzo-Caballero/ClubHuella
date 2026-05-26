import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ListaDeEspera = ({ onClose }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);

  // Validaciones
  const validarEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validarTelefono = (telefono) =>
    /^[0-9\s()+-]{6,20}$/.test(telefono);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { nombre, email, telefono } = formData;

    // Validaciones básicas
    if (!nombre || !email || !telefono) {
      setMensaje("Por favor completá todos los campos.");
      return;
    }

    if (!validarEmail(email)) {
      setMensaje("Ingresá un email válido.");
      return;
    }

    if (!validarTelefono(telefono)) {
      setMensaje("Ingresá un número de teléfono válido.");
      return;
    }

    try {
      const res = await fetch(
        "https://gestoradmin.store/LucianaTattoo.php?recurso=lista-espera",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        throw new Error("Error al enviar los datos.");
      }

      setMensaje("¡Gracias! Te contactaremos cuando haya un nuevo curso.");
      setFormData({ nombre: "", email: "", telefono: "" });
      setEnviado(true);

      setTimeout(() => {
        onClose(); // cerrar modal automáticamente
      }, 2000);
    } catch (error) {
      console.error(error);
      setMensaje("Ocurrió un error. Intentá más tarde.");
    }
  };

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-white p-6 rounded-xl shadow-lg w-full max-w-md mx-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl font-bold"
            aria-label="Cerrar"
          >
            &times;
          </button>

          <h3 className="text-xl font-bold text-[#9f7042] mb-4">Lista de Espera</h3>
          <p className="text-sm text-gray-600 mb-4">
            Los cupos están completos, pero podés dejar tus datos para sumarte a la lista de espera con prioridad.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded"
            />
            <input
              type="tel"
              name="telefono"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded"
            />
            <button
              type="submit"
              disabled={enviado}
              className={`w-full py-2 px-4 rounded transition font-semibold ${
                enviado
                  ? "bg-green-600 text-white cursor-not-allowed"
                  : "bg-[#9f7042] text-white hover:bg-[#875f35]"
              }`}
            >
              {enviado ? "Enviado" : "Unirme a la lista"}
            </button>
          </form>

          {mensaje && (
            <motion.p
              className="mt-4 text-sm text-center text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {mensaje}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ListaDeEspera;
