import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import termoImg from "../assets/termo.png";

export default function Checkout({ onContinuar }) {
  const PRECIO_PRODUCTO = 45000;

  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [openPago, setOpenPago] = useState(false);

  const colores = [
    "#1f2937","#111827","#374151","#4b5563","#6b7280",
    "#9ca3af","#d1d5db","#f3f4f6","#ef4444","#f97316",
    "#f59e0b","#eab308","#84cc16","#22c55e","#10b981",
    "#06b6d4","#3b82f6","#6366f1","#8b5cf6","#ec4899"
  ];

  // 🚀 FUNCIÓN CONTINUAR
  const handleContinuar = () => {
    if (!colorSeleccionado) {
      alert("Seleccioná un color antes de continuar");
      return;
    }

    onContinuar(); // 👉 cambia a pantalla de envíos
  };

  return (
    <div className="bg-[#ebebeb] min-h-screen flex justify-center p-6">
      <div className="bg-white max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded">

        {/* IZQUIERDA */}
        <div className="flex justify-center">
          <img src={termoImg} className="w-80 object-contain" />
        </div>

        {/* CENTRO */}
        <div className="flex flex-col gap-3">

          <span className="text-gray-500 text-sm">
            Nuevo | +100 vendidos
          </span>

          <h1 className="text-xl font-semibold">
            Combo Matero Stanley Termo 1,2lts Mate Bombilla Yerbera Fs Color Verde
          </h1>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-500">4.9</span>
            <span className="text-yellow-500">★★★★★</span>
            <span className="text-gray-500">(76)</span>
          </div>

          <div className="text-3xl font-light">
            ${PRECIO_PRODUCTO.toLocaleString()}
          </div>

          <p className="text-xs text-gray-400">
            Precio sin impuestos nacionales
          </p>

          {/* DROPDOWN PAGOS */}
          <div className="mt-2">
            <button
              onClick={() => setOpenPago(!openPago)}
              className="text-blue-500 text-sm"
            >
              Ver medios de pago
            </button>

            <AnimatePresence>
              {openPago && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 border rounded-lg p-4 bg-gray-50 text-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    
                    {/* MercadoPago SVG */}
                    <svg width="40" height="40" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="50" fill="#009EE3"/>
                      <path d="M30 50c10-15 30-15 40 0" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
                      <path d="M30 60c10 15 30 15 40 0" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
                    </svg>

                    <div>
                      <p className="font-medium">
                        Dinero disponible en Mercado Pago
                      </p>
                      <p className="text-gray-500 text-xs">
                        Pagá con saldo, transferencia o efectivo.
                      </p>
                    </div>
                  </div>

                  <p className="text-blue-500 text-xs cursor-pointer">
                    Ver más
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* COLORES */}
          <div className="mt-3">
            <p className="text-sm font-medium mb-2">
              Color:
            </p>

            <div className="flex flex-wrap gap-2">
              {colores.map((c, i) => (
                <motion.div
                  key={i}
                  onClick={() => setColorSeleccionado(c)}
                  whileTap={{ scale: 0.9 }}
                  className={`w-7 h-7 rounded-full cursor-pointer border-2 ${
                    colorSeleccionado === c
                      ? "border-black scale-110"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* DETALLE */}
          <div className="mt-4 text-sm text-gray-700">
            <p className="font-semibold mb-2">
              Lo que tenés que saber de este producto
            </p>

            <ul className="list-disc ml-5 space-y-1">
              <li>Diseño liso.</li>
              <li>Termo de 1.2L mantiene temperatura hasta 36hs.</li>
              <li>Fácil limpieza.</li>
              <li>Yerbera de 500g.</li>
            </ul>
          </div>
        </div>

        {/* DERECHA */}
        <div className="border rounded-lg p-4 flex flex-col gap-4 h-fit">

          <div className="text-sm text-gray-600 flex items-center gap-1">
            <span>
              Tienda oficial <span className="font-medium">BAKANA</span>
            </span>

            {/* Badge verificado */}
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#3483FA">
              <path d="M12 2l2.2 1.6 2.7-.5 1.2 2.5 2.6 1.2-.5 2.7L22 12l-1.6 2.2.5 2.7-2.6 1.2-1.2 2.5-2.7-.5L12 22l-2.2-1.6-2.7.5-1.2-2.5-2.6-1.2.5-2.7L2 12l1.6-2.2-.5-2.7 2.6-1.2 1.2-2.5 2.7.5L12 2z"/>
              <path d="M8.8 12.5l2 2 4.2-4.2" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round"/>
            </svg>

            <p className="text-gray-500 ml-2">+50 mil ventas</p>
          </div>

          <div>
            <p className="font-medium">Stock disponible</p>
            <p className="text-gray-500 text-sm">Cantidad: 20 unidades</p>
          </div>

          <button
            onClick={handleContinuar}
            className="bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition"
          >
            Comprar ahora
          </button>

        </div>

      </div>
    </div>
  );
}