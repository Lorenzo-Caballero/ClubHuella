import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiActivity, FiBarChart2, FiHome, FiRefreshCw, FiSettings, FiShoppingBag, FiLogOut } from 'react-icons/fi';
import { PAYMENTS_URL } from '../../config/env';
import { adminFetch } from '../../lib/adminSession';
import PedidosAdmin from './PedidosAdmin';

const SECTIONS = [
  { id: 'overview', label: 'Resumen', icon: FiHome },
  { id: 'orders', label: 'Pedidos', icon: FiShoppingBag },
  { id: 'analytics', label: 'Analítica', icon: FiBarChart2 },
  { id: 'settings', label: 'Configuración', icon: FiSettings },
];
const PAID_STATES = new Set(['aprobado', 'en_preparacion', 'enviado', 'entregado']);
const money = (value) => `$${Number(value || 0).toLocaleString('es-AR')}`;
const dateValue = (value) => {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
};

function Metric({ label, value, note }) {
  return <section className="rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-5"><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#99948a]">{label}</div><div className="mt-2 font-serif text-[26px] text-[#33342f]">{value}</div><div className="mt-1 text-[10px] text-[#a19d93]">{note}</div></section>;
}

function PageTitle({ eyebrow, title, subtitle, right }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#a49e92]">{eyebrow}</div><h1 className="mt-1 font-serif text-[27px] text-[#33342f] sm:text-[31px]">{title}</h1><p className="mt-1 text-[11px] text-[#8f8a80]">{subtitle}</p></div>{right}</div>;
}

function SalesBars({ orders, days }) {
  const bars = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const result = Array.from({ length: days }, (_, index) => {
      const day = new Date(today); day.setDate(today.getDate() - (days - index - 1));
      return { day, total: 0 };
    });
    const map = new Map(result.map((item) => [item.day.toDateString(), item]));
    orders.forEach((order) => {
      if (!PAID_STATES.has(String(order.estado || '').toLowerCase())) return;
      const date = dateValue(order.created_at);
      if (!date) return;
      date.setHours(0, 0, 0, 0);
      const bucket = map.get(date.toDateString());
      if (bucket) bucket.total += Number(order.total || 0);
    });
    return result;
  }, [orders, days]);
  const max = Math.max(1, ...bars.map((item) => item.total));
  return <div className="mt-6"><div className="flex h-36 items-end gap-1.5 sm:gap-2">{bars.map((item) => <div key={item.day.toISOString()} title={`${item.day.toLocaleDateString('es-AR')}: ${money(item.total)}`} className="group flex h-full flex-1 items-end"><div className="w-full rounded-t-md bg-[#a76547] transition hover:bg-[#83452e]" style={{ height: `${Math.max(item.total ? 8 : 2, item.total / max * 100)}%` }} /></div>)}</div><div className="mt-2 flex justify-between text-[9px] text-[#a19d93]"><span>{bars[0]?.day.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span><span>Ingresos confirmados · ARS</span><span>Hoy</span></div></div>;
}

function OrdersTable({ orders, onSeeAll }) {
  const recent = orders.slice(0, 6);
  return <section className="overflow-hidden rounded-2xl border border-[#eeebe4] bg-white"><div className="flex items-center justify-between gap-2 border-b border-[#f0ede7] px-4 py-4 sm:px-5"><div><h2 className="font-serif text-[18px] text-[#33342f]">Pedidos recientes</h2><p className="mt-1 text-[10px] text-[#a19d93]">Información cargada desde la base de datos</p></div><button onClick={onSeeAll} className="text-[10px] font-semibold text-[#914c30] hover:underline">Ver todos</button></div>{recent.length === 0 ? <div className="px-5 py-10 text-center text-[11px] text-[#99948a]">Todavía no hay pedidos registrados.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left text-[11px]"><thead className="bg-[#fbfaf7] text-[9px] uppercase tracking-wider text-[#99948a]"><tr>{['Pedido', 'Mascota', 'Estado', 'Total', 'Fecha'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#f0ede7]">{recent.map((order) => <tr key={order.id} className="text-[#55564f]"><td className="px-4 py-3 font-semibold">#{order.id}</td><td className="px-4 py-3">{order.nombre_mascota || '—'}<div className="mt-0.5 text-[9px] text-[#a19d93]">{order.estilo || 'Diseño'} · {order.color || '—'} · T{order.talle || '—'}</div></td><td className="px-4 py-3">{order.estado || '—'}</td><td className="px-4 py-3 font-semibold">{money(order.total)}</td><td className="px-4 py-3">{dateValue(order.created_at)?.toLocaleDateString('es-AR') || '—'}</td></tr>)}</tbody></table></div>}</section>;
}

export default function UnifiedAdminPanel({ onLogout }) {
  const [section, setSection] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await adminFetch(`${PAYMENTS_URL}?action=listar`);
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch { throw new Error(`Respuesta no válida del servidor (${response.status}).`); }
      if (!response.ok || data?.ok === false) throw new Error(data?.error || `Error ${response.status}`);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message || 'No se pudieron cargar los pedidos.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const paid = orders.filter((order) => PAID_STATES.has(String(order.estado || '').toLowerCase()));
  const revenue = paid.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pending = orders.filter((order) => String(order.estado || '').toLowerCase() === 'pendiente').length;
  const paidPayments = new Set(paid.map((order) => order.mp_payment_id || order.external_ref || order.id));
  const average = paidPayments.size ? revenue / paidPayments.size : 0;
  const labels = Object.fromEntries(SECTIONS.map(({ id, label }) => [id, label]));

  return <div className="min-h-screen bg-[#f7f6f2] font-sans text-[#33342f]"><div className="flex min-h-screen">
    <aside className="hidden w-[238px] shrink-0 flex-col border-r border-[#eeeae2] bg-[#fbfaf7] px-4 py-5 lg:flex"><div className="mb-8 flex items-center gap-3 px-2"><div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#9a4e2f] text-lg text-white">🐾</div><div><div className="font-serif text-[17px] font-semibold">Club Huella</div><div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#a59c8d]">Administración</div></div></div><div className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#aaa397]">Negocio</div><nav className="space-y-1">{SECTIONS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setSection(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-medium transition ${section === id ? 'bg-[#efe9df] text-[#693d28]' : 'text-[#77766e] hover:bg-[#f1eee8]'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav><div className="mt-auto rounded-2xl border border-[#ece7de] bg-white p-3"><div className="text-[10px] font-semibold">Sesión de administración</div><button onClick={onLogout} className="mt-2 inline-flex items-center gap-2 text-[10px] text-[#8b6855] hover:text-[#693d28]"><FiLogOut /> Cerrar sesión</button></div></aside>
    <main className="min-w-0 flex-1"><header className="sticky top-0 z-20 border-b border-[#eeeae2] bg-[#fffefa]/95 px-4 py-3 backdrop-blur sm:px-7 lg:px-9"><div className="flex items-center justify-between gap-3"><div><div className="text-[9px] text-[#99948a]">Club Huella <span className="mx-1">/</span>{labels[section]}</div><div className="mt-0.5 font-serif text-[17px]">Panel de administración</div></div><div className="flex items-center gap-2"><button onClick={refresh} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#eae7df] bg-white px-3 text-[10px] font-semibold text-[#716e66] disabled:opacity-50"><FiRefreshCw className={loading ? 'animate-spin' : ''} />Actualizar</button><button onClick={onLogout} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#eae7df] bg-white px-3 text-[10px] font-semibold text-[#716e66] lg:hidden"><FiLogOut />Salir</button></div></div><nav className="mt-3 flex gap-1 overflow-x-auto lg:hidden">{SECTIONS.map(({ id, label }) => <button key={id} onClick={() => setSection(id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-semibold ${section === id ? 'bg-[#efe9df] text-[#693d28]' : 'text-[#77766e]'}`}>{label}</button>)}</nav></header>
      <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[11px] text-rose-800">{error} <button onClick={refresh} className="ml-2 font-bold underline">Reintentar</button></div>}
        {section === 'overview' && <><PageTitle eyebrow="Tu tienda" title="Resumen" subtitle="Actividad basada en pedidos guardados en el servidor." />{loading ? <div className="py-14 text-center text-[11px] text-[#99948a]">Cargando datos reales…</div> : <><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><Metric label="Ingresos confirmados" value={money(revenue)} note="Suma de pedidos pagados y no cancelados" /><Metric label="Remeras registradas" value={orders.length.toLocaleString('es-AR')} note="Una fila por unidad en la base" /><Metric label="Pagos aprobados" value={paidPayments.size.toLocaleString('es-AR')} note="Agrupados por pago de Mercado Pago" /><Metric label="Pendientes" value={pending.toLocaleString('es-AR')} note={`Ticket medio: ${money(average)} por pago aprobado`} /></div><div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]"><section className="rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-5"><h2 className="font-serif text-[18px]">Ventas registradas</h2><p className="mt-1 text-[10px] text-[#a19d93]">Importes de pedidos con pago aprobado, según su fecha de creación.</p><SalesBars orders={orders} days={30} /></section><section className="rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-5"><div className="flex items-center gap-2"><FiActivity className="text-[#9a4e2f]" /><h2 className="font-serif text-[18px]">Medición del recorrido</h2></div><p className="mt-3 text-[11px] leading-relaxed text-[#77766e]">El panel conoce los pedidos guardados, pero todavía no recibe sesiones ni eventos del embudo desde Meta. Por eso no muestra porcentajes de conversión inventados.</p><div className="mt-4 rounded-xl bg-[#f8f4ee] p-3 text-[10px] leading-relaxed text-[#7c6a53]">Cuando se defina el Pixel correcto, se podrá conectar el seguimiento para medir desde la visita hasta la compra.</div><button onClick={() => setSection('analytics')} className="mt-4 text-[10px] font-semibold text-[#914c30] hover:underline">Ver analítica</button></section></div><div className="mt-4"><OrdersTable orders={orders} onSeeAll={() => setSection('orders')} /></div></>}</>}
        {section === 'orders' && <><PageTitle eyebrow="Operación" title="Pedidos" subtitle="Consultá, actualizá y descargá los archivos asociados a cada pedido." /><PedidosAdmin embedded /></>}
        {section === 'analytics' && <><PageTitle eyebrow="Ventas y adquisición" title="Analítica" subtitle="Ventas obtenidas de los pedidos reales de la base de datos." right={<select value={days} onChange={(event) => setDays(Number(event.target.value))} className="h-9 rounded-xl border-[#e8e3d9] bg-white px-3 text-[10px]"><option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option></select>} />{loading ? <div className="py-14 text-center text-[11px] text-[#99948a]">Cargando pedidos…</div> : <><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Metric label="Ingresos confirmados" value={money(revenue)} note="Estados pagados no cancelados" /><Metric label="Pagos aprobados" value={paidPayments.size} note="Agrupados por transacción" /><Metric label="Ticket promedio" value={money(average)} note="Importe medio por pago aprobado" /></div><section className="mt-4 rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-6"><h2 className="font-serif text-[19px]">Ingresos por día</h2><p className="mt-1 text-[10px] text-[#a19d93]">Los importes de envío están incluidos tal como se registraron en cada pago.</p><SalesBars orders={orders} days={days} /></section><section className="mt-4 rounded-2xl border border-[#eadbbf] bg-[#fffaf0] p-4 sm:p-5"><h2 className="font-serif text-[17px] text-[#594d3b]">Embudo de compra</h2><p className="mt-2 text-[11px] leading-relaxed text-[#765d37]">Aún no hay eventos de navegación almacenados en el servidor. Hasta configurar y validar Meta Pixel, esta vista solo puede informar pedidos e ingresos; no puede atribuir visitas, inicios de compra ni abandonos.</p></section></>}</>}
        {section === 'settings' && <><PageTitle eyebrow="Cuenta y medición" title="Configuración" subtitle="Estado actual de las conexiones de la tienda." /><div className="grid max-w-3xl gap-4"><section className="rounded-2xl border border-[#eeebe4] bg-white p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-serif text-[18px]">Meta Pixel</h2><p className="mt-1 text-[10px] text-[#99948a]">La web aún no tiene un ID de Pixel definido.</p></div><span className="rounded-full bg-[#f6f0e2] px-2.5 py-1 text-[9px] font-semibold text-[#94753e]">Pendiente de conectar</span></div><p className="mt-4 text-[11px] leading-relaxed text-[#77766e]">El campo de edición que aparecía en la vista previa local solo guardaba el valor en ese navegador y no configuraba el sitio. Para evitar una falsa sensación de conexión, la edición aparecerá aquí cuando quede enlazada al servidor.</p></section><section className="rounded-2xl border border-[#eeebe4] bg-white p-5"><h2 className="font-serif text-[18px]">Precio y costos</h2><p className="mt-1 text-[10px] text-[#99948a]">Los valores de la vista local eran una simulación. El precio de venta vigente está definido en el checkout y backend; no se puede cambiar desde este panel todavía.</p></section><section className="rounded-2xl border border-[#eeebe4] bg-white p-5"><h2 className="font-serif text-[18px]">Acceso administrador</h2><p className="mt-1 text-[10px] text-[#99948a]">Este panel usa la sesión protegida del servidor. El botón de salida cierra esa sesión.</p></section></div></>}
        <footer className="mt-8 border-t border-[#ece9e2] pt-4 text-[9px] text-[#aaa59a]">Club Huella · Datos de pedidos consultados en el servidor</footer>
      </div>
    </main>
  </div></div>;
}
