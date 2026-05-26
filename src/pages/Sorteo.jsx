import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Lista de participantes
const participantes = [
  "luciana_tattoo", "juan_ink", "sofia.art", "marcos_draws", "lola_tinta",
  "tattoo_by_nico", "emilia.arte", "cris_black", "vane_lines", "mati_needle"
];

// Ganadores simulados (elige los que quieras)
const ganadoresSimulados = ["tct_lpc", "santanderbruno"];

const InstagramGiveaway = () => {
  const [estadoSorteo, setEstadoSorteo] = useState("inicio"); // inicio | seleccionando | terminado
  const [ganadores, setGanadores] = useState([]);
  const [nombreMostrado, setNombreMostrado] = useState("");

  useEffect(() => {
    if (estadoSorteo === "seleccionando") {
      let index = 0;
      const interval = setInterval(() => {
        const nombre = participantes[index % participantes.length];
        setNombreMostrado(nombre);
        index++;
      }, 100); // cambia cada 100ms

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setGanadores(ganadoresSimulados);
        setEstadoSorteo("terminado");
      }, 5000); // duración total de la "selección"

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [estadoSorteo]);

  const iniciarSorteo = () => {
    setEstadoSorteo("seleccionando");
    setGanadores([]);
    setNombreMostrado("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-pink-100 to-purple-200 p-6 text-center">
      <h1 className="text-4xl font-extrabold mb-6 text-purple-800">🎉 Sorteados.com 🎉</h1>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6 border border-purple-300">
        {/* Botón o texto */}
        {estadoSorteo === "inicio" && (
          <motion.button
            onClick={iniciarSorteo}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-purple-700 transition mb-6"
          >
            Comenzar sorteo
          </motion.button>
        )}

        {estadoSorteo === "seleccionando" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-medium text-purple-700 mb-6"
          >
            Seleccionando ganadores...
          </motion.p>
        )}

        {/* Nombre animado durante la selección */}
        <AnimatePresence>
          {estadoSorteo === "seleccionando" && (
            <motion.div
              key="animando"
              className="h-20 flex items-center justify-center"
            >
              <motion.span
                key={nombreMostrado}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="text-2xl font-bold text-purple-800"
              >
                @{nombreMostrado}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mostrar ganadores */}
        {estadoSorteo === "terminado" && (
          <motion.div
            key="ganadores"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-green-600 mb-4">¡Ganadores! 🎁</h2>
            <ul className="space-y-2 text-lg font-medium text-purple-800">
              {ganadores.map((g, idx) => (
                <li key={idx} className="bg-purple-100 px-4 py-2 rounded-full shadow">
                  @{g}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      <p className="mt-8 text-sm text-gray-500">Gracias a todos por participar 💜</p>
    </div>
  );
};

export default InstagramGiveaway;
