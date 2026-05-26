import { useState, useEffect } from "react";

export default function Envios({ onBack }) {
  const PRECIO_PRODUCTO = 45000;

  const [form, setForm] = useState({
    cp: "",
    direccion: "",
    ciudad: "",
    nombre: "",
    telefono: ""
  });

  const [opciones, setOpciones] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 Traducción de servicios
  const traducirServicio = (service) => {
    const map = {
      standard_dom: "Envío a domicilio",
      standard_suc: "Retiro en sucursal",
      priority_dom: "Envío prioritario",
      priority_suc: "Retiro prioritario en sucursal",
      express_dom: "Envío express"
    };
    return map[service] || service;
  };

  const calcularEnvio = async () => {
    try {
      const res = await fetch(
        "https://argames.store/payments_envios.php?action=rate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );

      const data = await res.json();
      if (!data.ok) return;

      setOpciones(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (form.cp.length >= 4) calcularEnvio();
  }, [form]);

  const total = seleccionado
    ? PRECIO_PRODUCTO + Number(seleccionado.price)
    : PRECIO_PRODUCTO;

  return (
    <div className="bg-[#ebebeb] min-h-screen flex justify-center p-6">
      <div className="max-w-6xl w-full grid md:grid-cols-3 gap-6">

        {/* IZQUIERDA */}
        <div className="md:col-span-2 bg-white p-6 rounded">

          <h2 className="text-xl font-semibold mb-4">
            Elegí la forma de entrega
          </h2>

          {/* FORM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {["nombre", "telefono", "direccion", "ciudad", "cp"].map(f => (
              <input
                key={f}
                name={f}
                placeholder={f}
                onChange={handleChange}
                className="border p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          {/* OPCIONES */}
          <div className="space-y-3">
            {opciones.map((op, i) => (
              <div
                key={i}
                onClick={() => setSeleccionado(op)}
                className={`border rounded p-4 cursor-pointer flex justify-between items-center transition ${
                  seleccionado === op
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-400"
                }`}
              >
                <div>
                  <p className="font-medium">
                    {traducirServicio(op.service)}
                  </p>

                  <p className="text-sm text-gray-500">
                    Llega entre 5 a 7 días hábiles
                  </p>
                </div>

                <p className="text-green-600 font-medium">
                  ${Number(op.price).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          
        </div>

        {/* DERECHA */}
        <div className="bg-white p-6 rounded h-fit">

          <h3 className="font-semibold mb-4">
            Resumen de compra
          </h3>

          <div className="flex justify-between text-sm mb-2">
            <span>Producto</span>
            <span>${PRECIO_PRODUCTO.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm mb-2">
            <span>Envío</span>
            <span className="text-green-600">
              {seleccionado
                ? `$${Number(seleccionado.price).toLocaleString()}`
                : "-"}
            </span>
          </div>

          <hr className="my-3" />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>

          <button
            disabled={!seleccionado}
            className={`mt-4 w-full py-3 rounded text-white transition ${
              seleccionado
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Continuar
          </button>
        </div>

      </div>
    </div>
  );
}