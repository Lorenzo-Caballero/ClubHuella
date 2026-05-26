import React, { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

const TablaListaEspera = () => {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLista = async () => {
      try {
        const res = await fetch(
          "https://gestoradmin.store/LucianaTattoo.php?recurso=lista-espera"
        );
        const data = await res.json();
        setDatos(data);
      } catch (error) {
        console.error("Error al traer la lista:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLista();
  }, []);

  const mensaje = encodeURIComponent(
    "Hola soy Luciana! quedaste agendado para la lista de espera de mi curso online!"
  );

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-[#9f7042] mb-6 text-center">
        Lista de Espera Registrada
      </h2>

      {loading ? (
        <p className="text-center text-gray-600">Cargando datos...</p>
      ) : datos.length === 0 ? (
        <p className="text-center text-gray-500">No hay registros aún.</p>
      ) : (
        <>
          {/* Vista para pantallas grandes */}
          <div className="hidden md:block overflow-x-auto shadow border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-[#fef9f4] text-[#9f7042] uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Nombre</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Teléfono</th>
                  <th className="px-6 py-3 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {datos.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                    <td className="px-6 py-4">{item.nombre}</td>
                    <td className="px-6 py-4">{item.email}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      {item.telefono}
                      <a
                        href={`https://wa.me/${item.telefono}?text=${mensaje}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        <FaWhatsapp size={18} />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{item.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista tipo card para pantallas pequeñas */}
          <div className="md:hidden space-y-4">
            {datos.map((item, index) => (
              <div
                key={item.id}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="text-xs text-gray-400 mb-1">#{index + 1}</div>
                <p>
                  <span className="font-semibold text-[#9f7042]">Nombre:</span>{" "}
                  {item.nombre}
                </p>
                <p>
                  <span className="font-semibold text-[#9f7042]">Email:</span>{" "}
                  {item.email}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-[#9f7042]">
                    Teléfono:
                  </span>{" "}
                  {item.telefono}
                  <a
                    href={`https://wa.me/${item.telefono}?text=${mensaje}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700"
                    title="Enviar WhatsApp"
                  >
                    <FaWhatsapp size={18} />
                  </a>
                </p>
                <p className="text-sm text-gray-500 mt-2">{item.fecha}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TablaListaEspera;
