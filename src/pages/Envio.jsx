import { useState, useEffect } from "react";

export default function Envios({ onBack }) {
  const PRECIO_PRODUCTO = 45000;
  const EXTRA_ENVIO = 1000;

  const [form, setForm] = useState({
    cp: "",
    direccion: "",
    ciudad: "",
    nombre: "",
    telefono: ""
  });

  const [opciones, setOpciones] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPago, setLoadingPago] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
      setLoading(true);

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

      const opcionesConExtra = data.data.map((op, i) => ({
        ...op,
        id: i,
        price: Number(op.price) + EXTRA_ENVIO
      }));

      setOpciones(opcionesConExtra);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (form.cp.length >= 4) calcularEnvio();
  }, [form]);

  const total = seleccionado
    ? PRECIO_PRODUCTO + Number(seleccionado.price)
    : PRECIO_PRODUCTO;

  // 🔥 COMPRA ROBUSTA
  const handleComprar = async () => {
    if (!seleccionado) return;
  
    try {
      setLoadingPago(true);
  
      const res = await fetch(
        "https://argames.store/payments_envios.php?action=create_preference",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            envio: seleccionado,
            total: Number(total)
          })
        }
      );
  
      const text = await res.text();
      console.log("RATE RAW:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("NO JSON:", text);
        return;
      }
  
      console.log("JSON:", data);
  
      const url =
        data.init_point ||
        data.sandbox_init_point ||
        data.url ||
        null;
  
      if (url) {
        window.location.href = url;
        return;
      }
  
      // fallback si viene ID
      if (data.id || data.preference_id) {
        const prefId = data.id || data.preference_id;
        window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${prefId}`;
        return;
      }
  
      alert("❌ No se recibió URL de pago");
  
    } catch (err) {
      console.error("ERROR:", err);
      alert("Error de conexión");
    } finally {
      setLoadingPago(false);
    }
  };
  return (
    <div className="bg-gray-100 min-h-screen flex justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-3 gap-6">

        {/* IZQUIERDA */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-6">
            📦 Forma de entrega
          </h2>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {["nombre", "telefono", "direccion", "ciudad", "cp"].map(f => (
              <input
                key={f}
                name={f}
                placeholder={f.toUpperCase()}
                onChange={handleChange}
                className="border p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          {loading && <p>Calculando envíos...</p>}

          <div className="space-y-3">
            {opciones.map((op) => (
              <div
                key={op.id}
                onClick={() => setSeleccionado(op)}
                className={`p-4 rounded-xl border cursor-pointer flex justify-between ${
                  seleccionado?.id === op.id
                    ? "border-blue-500 bg-blue-50"
                    : ""
                }`}
              >
                <div>
                  <p>{traducirServicio(op.service)}</p>
                  <p className="text-xs text-gray-500">
                    Llega en 5 a 7 días
                  </p>
                </div>

                <span className="text-green-600 font-semibold">
                  ${Number(op.price).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <button onClick={onBack} className="mt-6 text-blue-500">
            ← Volver
          </button>
        </div>

        {/* DERECHA */}
        <div className="bg-white rounded-2xl shadow p-6 h-fit">
          <h3 className="font-semibold mb-4">🧾 Resumen</h3>

          <div className="flex justify-between text-sm">
            <span>Producto</span>
            <span>${PRECIO_PRODUCTO.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Envío</span>
            <span>
              {seleccionado
                ? `$${Number(seleccionado.price).toLocaleString()}`
                : "-"}
            </span>
          </div>

          <hr className="my-4" />

          <div className="flex justify-between font-bold text-xl">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>

          <button
            onClick={handleComprar}
            disabled={!seleccionado || loadingPago}
            className="mt-6 w-full py-3 rounded-xl bg-blue-600 text-white"
          >
            {loadingPago ? "Procesando..." : "Comprar"}
          </button>
        </div>

      </div>
    </div>
  );
}