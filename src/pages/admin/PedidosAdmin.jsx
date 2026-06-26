import React, { useEffect, useState, useCallback } from "react";

const API = "https://clubhuella.com/backend/api/pedidos.php";

const ESTADOS = [
  { value: "pendiente",      label: "Pendiente",       color: "bg-gray-400" },
  { value: "aprobado",       label: "Aprobado",        color: "bg-green-500" },
  { value: "en_preparacion", label: "En preparación",  color: "bg-yellow-400" },
  { value: "enviado",        label: "Enviado",          color: "bg-blue-500" },
  { value: "entregado",      label: "Entregado",        color: "bg-emerald-500" },
  { value: "cancelado",      label: "Cancelado",        color: "bg-red-500" },
];

const EMPTY_FORM = {
  nombre_mascota: "", estilo: "", color: "", talle: "",
  total: "", precio_remera: "", precio_envio: "",
  destinatario_nombre: "", destinatario_telefono: "",
  tipo_entrega: "envio", direccion_completa: "", ciudad: "", provincia: "",
  estado: "pendiente", carrier: "", carrier_service: "",
  tracking_number: "", tracking_url: "",
  imagen_url: "", mp_payment_id: "", diseno_id: "",
};

function estadoBadge(estado) {
  const e = ESTADOS.find((x) => x.value === estado) ?? ESTADOS[0];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white ${e.color}`}>
      {e.label}
    </span>
  );
}

function money(v) {
  return "$" + Number(v || 0).toLocaleString("es-AR");
}

/* ─── Modal de formulario ─────────────────────────────────────── */
function PedidoModal({ pedido, onClose, onSaved }) {
  const [form, setForm] = useState(pedido ? { ...pedido } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(pedido?.id);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url  = isEdit ? `${API}?id=${pedido.id}` : API;
      const method = isEdit ? "PUT" : "POST";
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const field = (label, name, type = "text", options = null) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</label>
      {options ? (
        <select
          name={name}
          value={form[name]}
          onChange={handleChange}
          className="form-select bg-[#1e222b] border border-[#2a2f3a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={form[name] ?? ""}
          onChange={handleChange}
          className="bg-[#1e222b] border border-[#2a2f3a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#171a21] border border-[#2a2f3a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2f3a]">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? `Editar Pedido #${pedido.id}` : "Nuevo Pedido"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Mascota", "nombre_mascota")}
          {field("Estado", "estado", "text", ESTADOS)}
          {field("Estilo", "estilo")}
          {field("Color", "color")}
          {field("Talle", "talle")}
          {field("Total", "total", "number")}
          {field("Precio remera", "precio_remera", "number")}
          {field("Precio envío", "precio_envio", "number")}

          <div className="sm:col-span-2 border-t border-[#2a2f3a] pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Cliente y envío
          </div>

          {field("Nombre destinatario", "destinatario_nombre")}
          {field("Teléfono", "destinatario_telefono")}
          {field("Tipo entrega", "tipo_entrega", "text", [
            { value: "envio",  label: "Envío a domicilio" },
            { value: "tienda", label: "Retiro en tienda" },
          ])}
          {field("Dirección", "direccion_completa")}
          {field("Ciudad", "ciudad")}
          {field("Provincia", "provincia")}

          <div className="sm:col-span-2 border-t border-[#2a2f3a] pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Logística
          </div>

          {field("Correo", "carrier")}
          {field("Servicio", "carrier_service")}
          {field("Nro. tracking", "tracking_number")}
          {field("URL tracking", "tracking_url", "url")}

          <div className="sm:col-span-2 border-t border-[#2a2f3a] pt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Otros
          </div>

          {field("URL imagen", "imagen_url", "url")}
          {field("MP Payment ID", "mp_payment_id")}
          {field("Diseño ID", "diseno_id")}

          {error && (
            <div className="sm:col-span-2 text-red-400 text-sm bg-red-900/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-300 border border-[#2a2f3a] hover:bg-[#2a2f3a] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50 transition"
            >
              {loading ? "Guardando…" : isEdit ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Panel principal ─────────────────────────────────────────── */
export default function PedidosAdmin() {
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [modal, setModal]       = useState(null);   // null | "create" | pedido-obj
  const [deleting, setDeleting] = useState(null);   // id a eliminar

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(API);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setPedidos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  async function handleDelete(id) {
    try {
      const res  = await fetch(`${API}?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeleting(null);
      fetchPedidos();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }

  const totalFacturado = pedidos.reduce((s, p) => s + Number(p.total || 0), 0);

  return (
    <div className="min-h-screen bg-[#0f1115] text-white px-4 py-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Pedidos <span className="text-yellow-400">Club Huella</span>
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {pedidos.length} pedidos · facturado {money(totalFacturado)}
            </p>
          </div>
          <button
            onClick={() => setModal("create")}
            className="px-5 py-2 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition"
          >
            + Nuevo pedido
          </button>
        </div>

        {/* Estado */}
        {loading && (
          <div className="text-center text-gray-500 py-20">Cargando pedidos…</div>
        )}
        {error && (
          <div className="text-red-400 bg-red-900/30 rounded-xl px-4 py-3 mb-6">{error}</div>
        )}

        {/* Tabla */}
        {!loading && pedidos.length === 0 && !error && (
          <div className="text-center text-gray-500 border border-dashed border-[#2a2f3a] rounded-2xl py-16">
            Todavía no hay pedidos.
          </div>
        )}

        {!loading && pedidos.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-[#2a2f3a]">
            <table className="w-full text-sm">
              <thead className="bg-[#171a21] text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  {["#", "Mascota", "Cliente", "Estado", "Total", "Entrega", "Fecha", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2f3a]">
                {pedidos.map((p) => (
                  <tr key={p.id} className="bg-[#171a21] hover:bg-[#1e222b] transition">
                    <td className="px-4 py-3 text-gray-400">{p.id}</td>
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                      {p.nombre_mascota || "—"}
                      <div className="text-xs text-yellow-400 font-normal">
                        {p.estilo} · {p.color} · T{p.talle}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {p.destinatario_nombre || "—"}
                      <div className="text-xs text-gray-500">{p.destinatario_telefono}</div>
                    </td>
                    <td className="px-4 py-3">{estadoBadge(p.estado)}</td>
                    <td className="px-4 py-3 font-bold text-yellow-400 whitespace-nowrap">
                      {money(p.total)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {p.tipo_entrega === "tienda" ? "Retiro local" : p.ciudad || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("es-AR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal(p)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleting(p.id)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <PedidoModal
          pedido={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchPedidos(); }}
        />
      )}

      {/* Confirmación eliminar */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#171a21] border border-[#2a2f3a] rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <p className="text-white font-semibold text-lg mb-2">¿Eliminar pedido #{deleting}?</p>
            <p className="text-gray-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 border border-[#2a2f3a] hover:bg-[#2a2f3a] transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleting)}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
