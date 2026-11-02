import React, { useMemo, useState } from 'react';
import {
  FiActivity,
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiCircle,
  FiCreditCard,
  FiDownload,
  FiFilter,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMoreHorizontal,
  FiPackage,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi';
import vogueSample from '../../assets/styles/vogue.jpg';
import granuladoSample from '../../assets/styles/granulado.jpg';
import streetSample from '../../assets/styles/street.jpg';
import cleanLookSample from '../../assets/styles/clean-look.jpg';
import polaroidSample from '../../assets/styles/polaroid.jpg';
import retroSample from '../../assets/styles/retro.jpg';

const SESSION_KEY = 'clubhuella_admin_preview_session';
const PIXEL_KEY = 'clubhuella_admin_preview_pixel';
const BUSINESS_KEY = 'clubhuella_admin_preview_business';
const DEMO_USER = 'demo';
const DEMO_PASSWORD = 'huella-demo';
const ORDERS = [
  { id: 'CH-1084', pet: 'Milo', customer: 'Camila Ríos', style: 'Granulado', color: 'Blanca', size: 'M', total: 44900, status: 'En preparación', city: 'Mar del Plata', date: 'Hoy · 10:42', payment: 'Aprobado', initials: 'CR', tint: '#e9d3c1', originalUrl: granuladoSample, printUrl: null },
  { id: 'CH-1083', pet: 'Olivia', customer: 'Martín López', style: 'Vogue', color: 'Negra', size: 'L', total: 49900, status: 'Pendiente', city: 'CABA', date: 'Hoy · 09:18', payment: 'Pendiente', initials: 'ML', tint: '#d9dfeb', originalUrl: vogueSample, printUrl: null },
  { id: 'CH-1082', pet: 'Rocco', customer: 'Lucía Fernández', style: 'Street', color: 'Negra', size: 'XL', total: 44900, status: 'Enviado', city: 'Rosario', date: 'Ayer · 18:06', payment: 'Aprobado', initials: 'LF', tint: '#ecd9b4', originalUrl: streetSample, printUrl: null },
  { id: 'CH-1081', pet: 'Luna', customer: 'Julián Acosta', style: 'Clean Look', color: 'Blanca', size: 'S', total: 49900, status: 'Entregado', city: 'Córdoba', date: 'Ayer · 15:24', payment: 'Aprobado', initials: 'JA', tint: '#d8e8dc', originalUrl: cleanLookSample, printUrl: null },
  { id: 'CH-1080', pet: 'Nina', customer: 'Florencia Díaz', style: 'Polaroid', color: 'Negra', size: 'M', total: 44900, status: 'Cancelado', city: 'Mendoza', date: '30 oct · 12:51', payment: 'Rechazado', initials: 'FD', tint: '#edd8de', originalUrl: polaroidSample, printUrl: null },
  { id: 'CH-1079', pet: 'Simón', customer: 'Santiago Vega', style: 'Retro', color: 'Negra', size: 'L', total: 89800, status: 'En preparación', city: 'La Plata', date: '29 oct · 16:33', payment: 'Aprobado', initials: 'SV', tint: '#ded8eb', originalUrl: retroSample, printUrl: null },
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Resumen', icon: FiHome },
  { id: 'orders', label: 'Pedidos', icon: FiShoppingBag, count: '12' },
  { id: 'analytics', label: 'Analítica', icon: FiBarChart2 },
];

const statusTone = {
  'En preparación': 'bg-amber-50 text-amber-800 ring-amber-200',
  Pendiente: 'bg-slate-100 text-slate-600 ring-slate-200',
  Enviado: 'bg-sky-50 text-sky-700 ring-sky-200',
  Entregado: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelado: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const money = (value) => `$${Number(value || 0).toLocaleString('es-AR')}`;

function IconButton({ label, children, onClick, className = '' }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`grid h-10 w-10 place-items-center rounded-xl border border-[#eae7df] bg-white text-[#716e66] transition hover:border-[#d9d1c4] hover:text-[#292b28] ${className}`}>
      {children}
    </button>
  );
}

function DemoBanner() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#eadbbf] bg-[#fffaf0] px-4 py-2.5 text-xs leading-relaxed text-[#765d37]">
      <FiCircle className="h-2.5 w-2.5 shrink-0 fill-[#c2924c] text-[#c2924c]" />
      <span><b>Vista previa local.</b> Pedidos, ventas y conversiones son datos de ejemplo; los ajustes se guardan en este navegador.</span>
    </div>
  );
}

function Sidebar({ page, setPage, onLogout, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && <button aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-[#eeeae2] bg-[#fbfaf7] px-4 py-5 transition-transform lg:static lg:z-auto lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-2 pb-8">
          <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#9a4e2f] text-lg text-white">🐾</div>
          <div>
            <div className="font-serif text-[17px] font-semibold tracking-tight text-[#282824]">Club Huella</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a59c8d]">Administración</div>
          </div>
          <IconButton label="Cerrar menú" onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden"><FiX /></IconButton>
        </div>

        <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#aaa397]">Negocio</div>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon, count }) => {
            const active = page === id;
            return (
              <button key={id} onClick={() => { setPage(id); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${active ? 'bg-[#efe9df] text-[#693d28]' : 'text-[#77766e] hover:bg-[#f1eee8] hover:text-[#383a35]'}`}>
                <Icon className={`h-[17px] w-[17px] ${active ? 'text-[#9a4e2f]' : 'text-[#99968d]'}`} />
                <span className="flex-1">{label}</span>
                {count && <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#89857a]">{count}</span>}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#aaa397]">Configuración</div>
        <button onClick={() => { setPage('settings'); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${page === 'settings' ? 'bg-[#efe9df] text-[#693d28]' : 'text-[#77766e] hover:bg-[#f1eee8] hover:text-[#383a35]'}`}>
          <FiSettings className="h-[17px] w-[17px] text-[#99968d]" /><span>Preferencias</span>
        </button>

        <div className="mt-auto rounded-2xl border border-[#ece7de] bg-white p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#eadfd4] text-xs font-bold text-[#7e4b32]">CH</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-[#383a35]">Club Huella</div>
              <div className="mt-0.5 text-[10px] text-[#a19b8f]">Cuenta de prueba</div>
            </div>
            <button onClick={onLogout} title="Salir" className="text-[#9d978a] transition hover:text-[#9a4e2f]"><FiLogOut /></button>
          </div>
        </div>
      </aside>
    </>
  );
}

function PageHeading({ eyebrow, title, subtitle, right }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a59c8d]">{eyebrow}</div>}
        <h1 className="font-serif text-[27px] font-medium tracking-tight text-[#292b28] sm:text-[31px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[13px] text-[#88867e]">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function RangeSelect({ range, setRange }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-xl border border-[#eae7df] bg-white px-3 text-xs font-medium text-[#625f57]">
      <FiCalendar className="text-[#9a968c]" />
      <select aria-label="Período" value={range} onChange={(e) => setRange(e.target.value)} className="max-w-[124px] border-0 bg-transparent p-0 pr-5 text-xs focus:ring-0">
        <option>Últimos 30 días</option><option>Últimos 7 días</option><option>Últimos 90 días</option>
      </select>
    </label>
  );
}

function MetricCard({ label, value, change, icon: Icon, accent = 'clay', detail }) {
  const isUp = String(change).startsWith('+');
  const tone = accent === 'sage' ? 'bg-[#e9f0e9] text-[#658069]' : accent === 'gold' ? 'bg-[#f5efdf] text-[#a48444]' : accent === 'blue' ? 'bg-[#e8eef4] text-[#607d98]' : 'bg-[#f4e9e2] text-[#9a5a3d]';
  return (
    <div className="rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98948a]">{label}</div>
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-serif text-[27px] font-medium tracking-tight text-[#292b28] sm:text-[30px]">{value}</span>
        {change && <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${isUp ? 'text-[#64826a]' : 'text-[#ad6b52]'}`}>{isUp ? <FiArrowUpRight /> : <FiArrowDownRight />}{change.replace('+', '').replace('-', '')}</span>}
      </div>
      <div className="mt-1 text-[11px] text-[#a19d93]">{detail}</div>
    </div>
  );
}

const chartBars = [38, 52, 44, 65, 49, 74, 62, 55, 82, 66, 89, 72, 58, 77, 94, 70, 82, 67, 100, 80, 72, 92, 75, 88, 68, 98, 84, 74, 100, 90];

function SalesChart() {
  return (
    <div className="mt-5">
      <div className="flex h-[180px] items-end gap-[5px] border-b border-[#eeeae2] pb-2">
        {chartBars.map((height, index) => <div key={index} title={`${height * 930} ARS`} className={`flex-1 rounded-t-[4px] transition hover:opacity-70 ${index > 25 ? 'bg-[#9a4e2f]' : 'bg-[#e8d8ca]'}`} style={{ height: `${height}%` }} />)}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[#aaa59a]"><span>1 oct</span><span>8 oct</span><span>15 oct</span><span>22 oct</span><span>30 oct</span></div>
    </div>
  );
}

const funnel = [
  { name: 'Visitas a la web', count: 1240, width: 100, color: '#c6b39a', note: 'Sesiones registradas' },
  { name: 'Vieron un diseño', count: 782, width: 76, color: '#b58c6d', note: '63% de las visitas' },
  { name: 'Agregaron al carrito', count: 116, width: 49, color: '#9a684e', note: '14,8% de quienes vieron un diseño' },
  { name: 'Iniciaron el pago', count: 69, width: 36, color: '#82523e', note: '59,5% de los carritos' },
  { name: 'Compra aprobada', count: 31, width: 24, color: '#5e765f', note: '44,9% de los pagos iniciados' },
];

function ConversionFunnel({ compact = false }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {funnel.map((step, index) => (
        <div key={step.name}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f4f1eb] text-[9px] font-bold text-[#8f887a]">0{index + 1}</span>
              <div className="min-w-0"><div className="truncate text-[12px] font-semibold text-[#4c4b45]">{step.name}</div>{!compact && <div className="mt-0.5 truncate text-[10px] text-[#a39d92]">{step.note}</div>}</div>
            </div>
            <div className="shrink-0 font-serif text-[17px] text-[#343530]">{step.count.toLocaleString('es-AR')}</div>
          </div>
          <div className="ml-[34px] h-2 overflow-hidden rounded-full bg-[#f0ede7]"><div className="h-full rounded-full transition-all" style={{ width: `${step.width}%`, backgroundColor: step.color }} /></div>
          {index < funnel.length - 1 && !compact && <div className="ml-[34px] mt-1.5 text-[10px] font-medium text-[#ad765b]">{Math.round((1 - funnel[index + 1].count / step.count) * 100)}% se pierde antes del próximo paso</div>}
        </div>
      ))}
    </div>
  );
}

function OrderTable({ orders, onSelect, selectedId, compact = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left">
        <thead><tr className="border-b border-[#f0ede7] text-[9px] font-bold uppercase tracking-[0.14em] text-[#a49f94]">{['Pedido', 'Cliente', 'Diseño', 'Total', 'Estado', ''].map((h) => <th key={h} className="px-4 py-3 font-bold first:pl-0">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#f2efe9]">
          {orders.slice(0, compact ? 5 : orders.length).map((order) => (
            <tr key={order.id} onClick={() => onSelect(order)} className={`cursor-pointer transition hover:bg-[#fcfbf8] ${selectedId === order.id ? 'bg-[#fcfbf8]' : ''}`}>
              <td className="whitespace-nowrap py-3.5 pl-0 pr-4"><div className="text-[11px] font-semibold text-[#474841]">{order.id}</div><div className="mt-0.5 text-[10px] text-[#aaa59a]">{order.date}</div></td>
              <td className="whitespace-nowrap px-4 py-3.5"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-full text-[9px] font-bold text-[#5d554b]" style={{ background: order.tint }}>{order.initials}</span><span className="text-[11px] font-medium text-[#55564f]">{order.customer}</span></div></td>
              <td className="whitespace-nowrap px-4 py-3.5"><div className="text-[11px] font-medium text-[#4c4d47]">{order.pet} · {order.style}</div><div className="mt-0.5 text-[10px] text-[#aaa59a]">Remera {order.color.toLowerCase()} · {order.size}</div></td>
              <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold text-[#41423d]">{money(order.total)}</td>
              <td className="whitespace-nowrap px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset ${statusTone[order.status]}`}>{order.status}</span></td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right"><button aria-label={`Ver pedido ${order.id}`} className="rounded-lg p-1.5 text-[#aaa59a] hover:bg-[#f1eee8] hover:text-[#514e45]"><FiChevronRight /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Overview({ setPage, setSelectedOrder, range, setRange }) {
  return (
    <>
      <PageHeading eyebrow="Domingo, 1 de noviembre" title="Buen día, Club Huella" subtitle="Así viene tu tienda en los últimos días." right={<RangeSelect range={range} setRange={setRange} />} />
      <div className="mb-5"><DemoBanner /></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Ventas" value={money(1286400)} change="+18,6%" icon={FiCreditCard} detail="vs. período anterior" />
        <MetricCard label="Pedidos" value="31" change="+12,4%" icon={FiShoppingBag} accent="sage" detail="27 aprobados · 4 pendientes" />
        <MetricCard label="Conversión" value="2,5%" change="+0,4 pp" icon={FiTrendingUp} accent="blue" detail="visita a compra aprobada" />
        <MetricCard label="Ticket promedio" value={money(41497)} change="+5,2%" icon={FiActivity} accent="gold" detail="por pedido aprobado" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.32fr_0.9fr]">
        <section className="rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-serif text-[18px] text-[#33342f]">Ventas en el tiempo</h2><p className="mt-1 text-[11px] text-[#a19d93]">Ingresos confirmados · pesos argentinos</p></div><div className="text-right"><div className="font-serif text-[21px] text-[#33342f]">$1.286.400</div><div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#66816b]"><FiArrowUpRight /> 18,6% vs. período anterior</div></div></div>
          <SalesChart />
        </section>
        <section className="rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="font-serif text-[18px] text-[#33342f]">Embudo de compra</h2><p className="mt-1 text-[11px] text-[#a19d93]">En qué paso se frena la gente</p></div><button onClick={() => setPage('analytics')} className="text-[10px] font-semibold text-[#9a4e2f] hover:underline">Ver análisis</button></div>
          <ConversionFunnel compact />
          <div className="mt-5 rounded-xl bg-[#f8f4ee] p-3 text-[11px] leading-relaxed text-[#7c6a53]"><b className="font-semibold text-[#785033]">Oportunidad:</b> la mayor caída aparece entre ver un diseño y agregarlo al carrito.</div>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-serif text-[18px] text-[#33342f]">Pedidos recientes</h2><p className="mt-1 text-[11px] text-[#a19d93]">Últimas ventas y estados</p></div><button onClick={() => setPage('orders')} className="text-[11px] font-semibold text-[#9a4e2f] hover:underline">Ver todos</button></div>
        <OrderTable orders={ORDERS} compact onSelect={setSelectedOrder} />
      </section>
    </>
  );
}

function OrdersPage({ search, setSearch, statusFilter, setStatusFilter, setSelectedOrder, selectedOrder }) {
  const [tab, setTab] = useState('Todos');
  const statuses = ['Todos', 'En preparación', 'Pendiente', 'Enviado', 'Entregado', 'Cancelado'];
  const filtered = useMemo(() => ORDERS.filter((order) => {
    const matchesTab = tab === 'Todos' || order.status === tab;
    const text = `${order.id} ${order.pet} ${order.customer} ${order.style}`.toLowerCase();
    return matchesTab && text.includes(search.toLowerCase()) && (!statusFilter || order.payment === statusFilter);
  }), [tab, search, statusFilter]);

  return (
    <>
      <PageHeading eyebrow="Operación de la tienda" title="Pedidos" subtitle="Consultá el estado y los datos de cada compra." right={<button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#914c30] px-3.5 text-xs font-semibold text-white transition hover:bg-[#783d27]"><FiDownload /> Exportar</button>} />
      <div className="mb-5"><DemoBanner /></div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#f1eee8] p-1">{statuses.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-semibold transition ${tab === item ? 'bg-white text-[#5c432f] shadow-sm' : 'text-[#858176] hover:text-[#4d4c45]'}`}>{item}</button>)}</div>
        <div className="flex items-center gap-2"><label className="flex h-9 items-center gap-2 rounded-xl border border-[#eae7df] bg-white px-3"><FiSearch className="text-[#9c978c]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pedido…" className="w-32 border-0 p-0 text-[11px] focus:ring-0 sm:w-44" /></label><label className="flex h-9 items-center gap-2 rounded-xl border border-[#eae7df] bg-white px-2.5"><FiFilter className="text-[#99948a]" /><select aria-label="Filtrar por pago" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-[92px] border-0 bg-transparent p-0 pr-4 text-[10px] text-[#69675f] focus:ring-0"><option value="">Pago</option><option>Aprobado</option><option>Pendiente</option><option>Rechazado</option></select></label></div>
      </div>
      <section className="rounded-2xl border border-[#eeebe4] bg-white px-4 sm:px-5"><div className="flex items-center justify-between py-4"><div className="text-[12px] font-semibold text-[#55564f]">{filtered.length} pedidos <span className="ml-1 font-normal text-[#a19d93]">· datos de muestra</span></div><IconButton label="Más opciones"><FiMoreHorizontal /></IconButton></div><OrderTable orders={filtered} selectedId={selectedOrder?.id} onSelect={setSelectedOrder} /></section>
    </>
  );
}

function AnalyticsPage({ range, setRange }) {
  return (
    <>
      <PageHeading eyebrow="Adquisición y conversión" title="Analítica" subtitle="Seguí el recorrido desde la primera visita hasta la compra." right={<RangeSelect range={range} setRange={setRange} />} />
      <div className="mb-5"><DemoBanner /></div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-6"><div className="mb-6"><h2 className="font-serif text-[19px] text-[#33342f]">Embudo de conversión</h2><p className="mt-1 text-[11px] text-[#a19d93]">Eventos del navegador y compras aprobadas</p></div><ConversionFunnel /></section>
        <section className="rounded-2xl border border-[#eeebe4] bg-white p-4 sm:p-6"><div><h2 className="font-serif text-[19px] text-[#33342f]">Ingresos y pedidos</h2><p className="mt-1 text-[11px] text-[#a19d93]">Evolución diaria del período</p></div><SalesChart /><div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#f0ede7] pt-4"><div><div className="text-[9px] font-semibold uppercase tracking-wider text-[#a19d93]">Ventas</div><div className="mt-1 font-serif text-[18px] text-[#33342f]">$1,28 M</div></div><div><div className="text-[9px] font-semibold uppercase tracking-wider text-[#a19d93]">Pedidos</div><div className="mt-1 font-serif text-[18px] text-[#33342f]">31</div></div><div><div className="text-[9px] font-semibold uppercase tracking-wider text-[#a19d93]">Promedio</div><div className="mt-1 font-serif text-[18px] text-[#33342f]">2,5%</div></div></div></section>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#eeebe4] bg-white p-5"><h2 className="font-serif text-[18px] text-[#33342f]">Señales para mirar</h2><div className="mt-4 space-y-3"><Insight title="Caída en la elección de diseño" text="Solo 116 de 782 personas que vieron un diseño lo agregaron al carrito." tone="clay" /><Insight title="Buen avance al checkout" text="6 de cada 10 carritos llegan a iniciar el pago." tone="sage" /><Insight title="Pagos pendientes" text="Hay 4 pagos que todavía no tienen confirmación." tone="gold" /></div></section>
        <section className="rounded-2xl border border-[#eeebe4] bg-white p-5"><h2 className="font-serif text-[18px] text-[#33342f]">Origen de las visitas</h2><div className="mt-4 space-y-4">{[['Instagram Ads', 48, '#a86749'], ['Instagram orgánico', 27, '#bca486'], ['Directo', 16, '#839882'], ['Otros', 9, '#a4b1bd']].map(([label, pct, color]) => <div key={label}><div className="mb-1.5 flex justify-between text-[11px]"><span className="text-[#66655e]">{label}</span><span className="font-semibold text-[#45463f]">{pct}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#f0ede7]"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} /></div></div>)}</div></section>
      </div>
    </>
  );
}

function Insight({ title, text, tone }) {
  const dot = tone === 'sage' ? 'bg-[#80977f]' : tone === 'gold' ? 'bg-[#bd9a54]' : 'bg-[#a76649]';
  return <div className="flex gap-3 rounded-xl bg-[#faf8f4] p-3.5"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot}`} /><div><div className="text-[11px] font-semibold text-[#505149]">{title}</div><p className="mt-1 text-[10px] leading-relaxed text-[#8c887e]">{text}</p></div></div>;
}

function SettingsPage({ pixelId, setPixelId, pixelSaved, setPixelSaved, business, setBusiness, businessSaved, setBusinessSaved }) {
  const [tab, setTab] = useState('pixel');
  const updateBusiness = (key, value) => { setBusiness((current) => ({ ...current, [key]: value })); setBusinessSaved(false); };
  const price = Number(business.price) || 0;
  const garment = Number(business.garment ?? business.cost) || 0;
  const print = Number(business.print) || 0;
  const tokens = Number(business.tokens) || 0;
  const shipping = Number(business.shipping) || 0;
  const paymentFee = price * (Number(business.paymentFeePct) || 0) / 100;
  const absorbedShipping = business.shippingAbsorbed === 'true' || business.shippingAbsorbed === true;
  const operatingCost = garment + print + tokens + paymentFee + (absorbedShipping ? shipping : 0);
  const grossProfit = price - operatingCost;
  const donation = Math.max(0, grossProfit) * (Number(business.donation) || 0) / 100;
  const netProfit = grossProfit - donation;
  const moneyValue = (value) => money(Math.round(value));

  const currencyField = (key, label) => (
    <label key={key} className="text-[11px] font-semibold text-[#5a5952]">{label}
      <span className="mt-2 flex h-11 items-center rounded-xl border border-[#e8e3d9] bg-[#fdfcf9] px-3 text-[#9b958a]">$ <input type="number" min="0" value={business[key] ?? ''} onChange={(e) => updateBusiness(key, e.target.value)} className="ml-1 w-full border-0 bg-transparent p-0 text-sm text-[#373832] focus:ring-0" /></span>
    </label>
  );
  return (
    <>
      <PageHeading eyebrow="Tu espacio de trabajo" title="Preferencias" subtitle="Configurá la medición y los datos base del negocio." />
      <div className="mb-5"><DemoBanner /></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="h-fit rounded-2xl border border-[#eeebe4] bg-white p-2">
          {[['pixel', 'Meta Pixel', FiActivity], ['business', 'Negocio', FiPackage], ['account', 'Acceso', FiSettings]].map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[12px] font-medium ${tab === id ? 'bg-[#f3eee6] text-[#75452e]' : 'text-[#77766e] hover:bg-[#faf8f4]'}`}><Icon className="h-4 w-4" />{label}<FiChevronRight className="ml-auto text-[#b1ab9e]" /></button>)}
        </nav>
        <section className="min-h-[420px] rounded-2xl border border-[#eeebe4] bg-white p-5 sm:p-7">
          {tab === 'pixel' && <>
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-serif text-[21px] text-[#33342f]">Medición de Meta</h2><p className="mt-1 text-[12px] text-[#99948a]">Conectá el Pixel de tu portafolio comercial.</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${pixelId ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f6f0e2] text-[#94753e]'}`}>{pixelId ? 'ID guardado en esta vista' : 'Aún sin conectar'}</span></div>
            <div className="mt-7 max-w-xl"><label htmlFor="pixelId" className="mb-2 block text-[11px] font-semibold text-[#5a5952]">ID del Pixel</label><input id="pixelId" value={pixelId} onChange={(e) => { setPixelId(e.target.value.replace(/\D/g, '').slice(0, 20)); setPixelSaved(false); }} placeholder="Ej.: 123456789012345" inputMode="numeric" className="h-11 w-full rounded-xl border-[#e8e3d9] bg-[#fdfcf9] px-3 text-sm tracking-wide text-[#373832] placeholder:text-[#c2bcb0] focus:border-[#9a4e2f] focus:ring-[#9a4e2f]/20" /><p className="mt-2 text-[10px] leading-relaxed text-[#a09b90]">Lo vas a encontrar en el Administrador de eventos de Meta, dentro de la fuente de datos de tu negocio. Este prototipo solo guarda el ID en este navegador; no conecta eventos reales.</p><button onClick={() => { localStorage.setItem(PIXEL_KEY, pixelId); setPixelSaved(true); }} disabled={pixelId.length > 0 && pixelId.length < 10} className="mt-4 h-10 rounded-xl bg-[#914c30] px-4 text-xs font-semibold text-white transition hover:bg-[#783d27] disabled:cursor-not-allowed disabled:opacity-40">Guardar configuración</button>{pixelSaved && <span className="ml-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#658069]"><FiCheck /> Guardado localmente</span>}</div>
            <div className="mt-8 border-t border-[#f0ede7] pt-5"><div className="text-[11px] font-semibold text-[#5a5952]">Eventos contemplados en el sitio</div><div className="mt-3 flex flex-wrap gap-2">{['PageView', 'ViewContent', 'AddToCart', 'AddShippingInfo', 'InitiateCheckout', 'Purchase'].map((event) => <span key={event} className="rounded-lg bg-[#f5f2ec] px-2.5 py-1.5 font-mono text-[9px] text-[#777166]">{event}</span>)}</div><p className="mt-3 text-[10px] text-[#a09b90]">Para validar eventos reales, primero hay que publicar con el ID correcto y probar el recorrido desde Events Manager.</p></div>
          </>}
          {tab === 'business' && <>
            <h2 className="font-serif text-[21px] text-[#33342f]">Precio y costos estimados</h2><p className="mt-1 text-[12px] text-[#99948a]">Editá los valores para estimar cuánto deja cada remera. Se guardan en este navegador.</p>
            <div className="mt-6 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
              {currencyField('price', 'Precio de venta por remera')}
              {currencyField('garment', 'Costo de la remera')}
              {currencyField('print', 'Costo de estampado')}
              {currencyField('tokens', 'Costo estimado de IA / tokens')}
              {currencyField('shipping', 'Costo estimado de envío')}
              <label className="text-[11px] font-semibold text-[#5a5952]">Comisión de pago estimada<span className="mt-2 flex h-11 items-center rounded-xl border border-[#e8e3d9] bg-[#fdfcf9] px-3"><input type="number" min="0" max="100" step="0.1" value={business.paymentFeePct ?? '0'} onChange={(e) => updateBusiness('paymentFeePct', e.target.value)} className="w-full border-0 bg-transparent p-0 text-sm text-[#373832] focus:ring-0" /><span className="text-sm text-[#9b958a]">%</span></span></label>
              <label className="text-[11px] font-semibold text-[#5a5952]">Donación sobre la ganancia<span className="mt-2 flex h-11 items-center rounded-xl border border-[#e8e3d9] bg-[#fdfcf9] px-3"><input type="number" min="0" max="100" value={business.donation} onChange={(e) => updateBusiness('donation', e.target.value)} className="w-full border-0 bg-transparent p-0 text-sm text-[#373832] focus:ring-0" /><span className="text-sm text-[#9b958a]">%</span></span></label>
            </div>
            <label className="mt-4 flex max-w-3xl cursor-pointer items-start gap-3 rounded-xl bg-[#faf8f4] p-3.5 text-[11px] text-[#66645d]"><input type="checkbox" checked={absorbedShipping} onChange={(e) => updateBusiness('shippingAbsorbed', e.target.checked)} className="mt-0.5 rounded border-[#d9d2c6] text-[#914c30] focus:ring-[#914c30]/20" /><span><b>El negocio absorbe el envío.</b><span className="mt-1 block text-[10px] text-[#99948a]">Desmarcado: el comprador lo paga aparte y no se resta del margen estimado.</span></span></label>
            <div className="mt-5 max-w-3xl rounded-2xl border border-[#eeebe4] bg-[#fbfaf7] p-4 sm:p-5"><div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a49e92]">Estimación por unidad</div><div className="grid grid-cols-2 gap-x-5 gap-y-3 text-[11px] sm:grid-cols-3"><div><div className="text-[#99948a]">Costos incluidos</div><b className="mt-1 block text-[#494a43]">{moneyValue(operatingCost)}</b></div><div><div className="text-[#99948a]">Ganancia antes de donación</div><b className="mt-1 block text-[#494a43]">{moneyValue(grossProfit)}</b></div><div><div className="text-[#99948a]">Donación estimada</div><b className="mt-1 block text-[#494a43]">{moneyValue(donation)}</b></div><div><div className="text-[#99948a]">Te queda estimado</div><b className={`mt-1 block ${netProfit >= 0 ? 'text-[#55765d]' : 'text-rose-700'}`}>{moneyValue(netProfit)}</b></div><div><div className="text-[#99948a]">Margen neto sobre venta</div><b className="mt-1 block text-[#494a43]">{price ? `${(netProfit / price * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })}%` : '—'}</b></div><div><div className="text-[#99948a]">Envío considerado</div><b className="mt-1 block text-[#494a43]">{absorbedShipping ? moneyValue(shipping) : 'A cargo del comprador'}</b></div></div><p className="mt-4 border-t border-[#ece8df] pt-3 text-[10px] leading-relaxed text-[#99948a]">Estimación simple: precio menos costos ingresados; la donación se calcula sobre la ganancia positiva antes de donar. Agregá impuestos, packaging, devoluciones y otros costos cuando tengas esos datos.</p></div>
            <button onClick={() => { localStorage.setItem(BUSINESS_KEY, JSON.stringify(business)); setBusinessSaved(true); }} className="mt-5 h-10 rounded-xl bg-[#914c30] px-4 text-xs font-semibold text-white transition hover:bg-[#783d27]">Guardar datos</button>{businessSaved && <span className="ml-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#658069]"><FiCheck /> Guardado localmente</span>}
          </>}
          {tab === 'account' && <><h2 className="font-serif text-[21px] text-[#33342f]">Acceso al panel</h2><p className="mt-1 text-[12px] text-[#99948a]">Esta pantalla de ingreso es solo una demostración local, no administra usuarios reales.</p><div className="mt-7 max-w-lg rounded-xl border border-[#eee9df] bg-[#faf8f4] p-4 text-[11px] leading-relaxed text-[#777166]">Antes de publicar habrá que configurar usuarios y contraseñas del lado del servidor, con sesiones protegidas. No se guardarán claves de administrador en el código del navegador.</div></>}
        </section>
      </div>
    </>
  );
}

function OrderDrawer({ order, onClose }) {
  if (!order) return null;
  const ArtworkFile = ({ title, url, filename, note, unavailable = false }) => (
    <div className="rounded-xl border border-[#eeeae2] bg-white p-3">
      <div className="text-[11px] font-semibold text-[#55564f]">{title}</div>
      {url ? <img src={url} alt={`${title} · ${order.id}`} className="mt-2 aspect-[4/3] w-full rounded-lg bg-[#f5f2ec] object-contain" /> : <div className="mt-2 grid aspect-[4/3] place-items-center rounded-lg bg-[#f5f2ec] px-4 text-center text-[10px] leading-relaxed text-[#989287]">{unavailable ? 'Este pedido de muestra no tiene archivo de impresión asociado.' : 'Todavía no hay un archivo asociado a este pedido.'}</div>}
      <div className="mt-2 min-h-[28px] text-[9px] leading-relaxed text-[#99948a]">{note}</div>
      {url ? <a href={url} download={filename} className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#914c30] text-[10px] font-semibold text-white transition hover:bg-[#783d27]"><FiDownload /> Descargar archivo</a> : <button type="button" disabled className="mt-2 h-9 w-full rounded-lg bg-[#f1eee8] text-[10px] font-semibold text-[#aaa59a]">Sin archivo disponible</button>}
    </div>
  );
  const sample = order.isSample !== false;
  return <><button aria-label="Cerrar detalle" onClick={onClose} className="fixed inset-0 z-30 bg-[#29251f]/25" /><aside className="fixed inset-y-0 right-0 z-40 w-full max-w-[430px] overflow-y-auto border-l border-[#e9e4dc] bg-[#fffefa] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a49e92]">Detalle del pedido</div><IconButton label="Cerrar" onClick={onClose}><FiX /></IconButton></div><div className="mt-7 flex items-start justify-between gap-3"><div><h2 className="font-serif text-[25px] text-[#33342f]">{order.id}</h2><div className="mt-1 text-[11px] text-[#a09b90]">{order.date} · {order.city}</div></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ring-1 ring-inset ${statusTone[order.status]}`}>{order.status}</span></div><div className="mt-6 rounded-2xl bg-[#f3eee6] p-4"><div className="text-[10px] font-semibold uppercase tracking-wider text-[#968d80]">Mascota</div><div className="mt-1 font-serif text-[22px] text-[#4b4038]">{order.pet}</div><div className="mt-1 text-[11px] text-[#776d61]">{order.style} · Remera {order.color.toLowerCase()} · Talle {order.size}</div></div><div className="mt-6 space-y-4">{[['Cliente', order.customer], ['Pago', order.payment], ['Total', money(order.total)], ['Entrega', order.city]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-[#f0ede7] pb-3 text-[11px]"><span className="text-[#9a958a]">{label}</span><span className="text-right font-medium text-[#494a43]">{value}</span></div>)}</div><div className="mt-7"><div className="flex items-baseline justify-between gap-2"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a49e92]">Archivos del diseño</div><span className="text-[9px] text-[#aaa59a]">{sample ? 'ejemplo visual' : 'archivos del pedido'}</span></div>{sample && <p className="mt-2 rounded-lg bg-[#fff8e9] px-3 py-2 text-[10px] leading-relaxed text-[#887044]">Vista previa: los pedidos de esta pantalla son ficticios. La imagen original es una referencia del estilo, no el diseño encargado; no hay archivo DTF real asociado.</p>}<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"><ArtworkFile title="Diseño original" url={order.originalUrl} filename={`${order.id}-original.jpg`} note={sample ? 'Referencia local del estilo · JPG' : (order.originalFileName || 'Archivo original del pedido')} /><ArtworkFile title="Listo para estampar" url={order.printUrl} filename={order.printFileName || `${order.id}-dtf.png`} note={order.printFileName || 'Archivo de impresión DTF · PNG'} unavailable={!order.printUrl} /></div></div><div className="mt-7"><div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#a49e92]">Historial</div><div className="mt-4 space-y-4">{[['Pedido recibido', order.date], ['Pago revisado', order.payment === 'Aprobado' ? 'Pago aprobado' : order.payment], [order.status, 'Actualización de estado']].map(([label, time], index) => <div key={`${label}-${index}`} className="flex gap-3"><div className="relative flex w-3 justify-center"><span className={`mt-1 h-2.5 w-2.5 rounded-full ${index === 2 ? 'bg-[#9a4e2f]' : 'bg-[#c5b59e]'}`} />{index < 2 && <span className="absolute top-4 h-7 w-px bg-[#e8e2d7]" />}</div><div><div className="text-[11px] font-semibold text-[#5c5b54]">{label}</div><div className="mt-0.5 text-[10px] text-[#a39d92]">{time}</div></div></div>)}</div></div></aside></>;
}

export default function AdminDashboard() {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem(SESSION_KEY) === '1');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [page, setPage] = useState('overview');
  const [range, setRange] = useState('Últimos 30 días');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pixelId, setPixelId] = useState(() => localStorage.getItem(PIXEL_KEY) || '');
  const [pixelSaved, setPixelSaved] = useState(false);
  const [business, setBusiness] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BUSINESS_KEY) || '{}');
      return { price: '44900', donation: '10', garment: saved.garment || saved.cost || '11000', print: '5000', tokens: '2000', shipping: '4500', shippingAbsorbed: false, paymentFeePct: '0', ...saved };
    } catch { return { price: '44900', donation: '10', garment: '11000', print: '5000', tokens: '2000', shipping: '4500', shippingAbsorbed: false, paymentFeePct: '0' }; }
  });
  const [businessSaved, setBusinessSaved] = useState(false);

  function login(e) {
    e.preventDefault();
    if (username === DEMO_USER && password === DEMO_PASSWORD) {
      localStorage.setItem(SESSION_KEY, '1');
      setLoggedIn(true);
      setLoginError('');
    } else setLoginError('En esta vista previa usá el usuario y clave de demostración indicados abajo.');
  }
  function logout() { localStorage.removeItem(SESSION_KEY); setLoggedIn(false); setPage('overview'); }

  if (!loggedIn) return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f0e8] px-5 py-10 text-[#33342f]">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#e9d9c8]/60 blur-3xl" /><div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#dfe7dc]/70 blur-3xl" />
      <form onSubmit={login} className="relative z-10 w-full max-w-[400px] rounded-[28px] border border-white/80 bg-white/90 p-7 shadow-[0_24px_80px_rgba(78,62,40,0.12)] backdrop-blur sm:p-9">
        <div className="mb-7 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#9a4e2f] text-xl text-white">🐾</div><div><div className="font-serif text-[21px] font-semibold">Club Huella</div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a59c8d]">Panel de administración</div></div></div>
        <div className="mb-6"><div className="mb-2 inline-flex rounded-full bg-[#f6f0e2] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#94753e]">Vista previa local</div><h1 className="font-serif text-[28px]">Hola de nuevo</h1><p className="mt-1.5 text-[12px] leading-relaxed text-[#8c887e]">Ingresá para ver los pedidos y las métricas de la tienda.</p></div>
        <label className="mb-4 block text-[10px] font-semibold text-[#67655d]">Usuario<input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu usuario" className="mt-1.5 h-11 w-full rounded-xl border-[#e8e3d9] bg-[#fdfcf9] px-3 text-sm focus:border-[#9a4e2f] focus:ring-[#9a4e2f]/20" /></label>
        <label className="block text-[10px] font-semibold text-[#67655d]">Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" className="mt-1.5 h-11 w-full rounded-xl border-[#e8e3d9] bg-[#fdfcf9] px-3 text-sm focus:border-[#9a4e2f] focus:ring-[#9a4e2f]/20" /></label>
        {loginError && <div role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[10px] text-rose-700">{loginError}</div>}
        <button className="mt-5 h-11 w-full rounded-xl bg-[#914c30] text-xs font-semibold text-white transition hover:bg-[#783d27]">Entrar al panel</button>
        <div className="mt-4 rounded-xl bg-[#faf8f4] p-3 text-[10px] leading-relaxed text-[#928b7f]">Acceso de muestra para este navegador: <b>demo</b> / <b>huella-demo</b>. No es una cuenta real.</div>
      </form>
    </main>
  );

  const titles = { overview: 'Resumen', orders: 'Pedidos', analytics: 'Analítica', settings: 'Preferencias' };
  return (
    <div className="min-h-screen bg-[#f7f6f2] font-sans text-[#33342f]">
      <div className="flex min-h-screen">
        <Sidebar page={page} setPage={setPage} onLogout={logout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between border-b border-[#eeeae2] bg-[#fffefa]/95 px-4 backdrop-blur sm:px-7 lg:px-9">
            <div className="flex items-center gap-2"><IconButton label="Abrir menú" onClick={() => setMobileOpen(true)} className="lg:hidden"><FiMenu /></IconButton><div className="text-[11px] text-[#99948a]">Club Huella <span className="mx-1 text-[#cbc4b8]">/</span><span className="font-semibold text-[#5c5b54]">{titles[page]}</span></div></div>
            <div className="flex items-center gap-2 sm:gap-3"><div className="hidden items-center gap-2 rounded-full bg-[#f4f1eb] px-3 py-1.5 text-[9px] font-semibold text-[#8a806f] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#c2924c]" /> DEMO LOCAL</div><button className="relative grid h-9 w-9 place-items-center rounded-xl text-[#868176] hover:bg-[#f4f1eb]"><FiActivity className="h-4 w-4" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#c47d5d]" /></button><div className="grid h-8 w-8 place-items-center rounded-full bg-[#eadfd4] text-[9px] font-bold text-[#7e4b32]">CH</div><FiChevronDown className="hidden text-[#aaa59a] sm:block" /></div>
          </header>
          <main className="mx-auto max-w-[1450px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
            {page === 'overview' && <Overview setPage={setPage} setSelectedOrder={setSelectedOrder} range={range} setRange={setRange} />}
            {page === 'orders' && <OrdersPage search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setSelectedOrder={setSelectedOrder} selectedOrder={selectedOrder} />}
            {page === 'analytics' && <AnalyticsPage range={range} setRange={setRange} />}
            {page === 'settings' && <SettingsPage pixelId={pixelId} setPixelId={setPixelId} pixelSaved={pixelSaved} setPixelSaved={setPixelSaved} business={business} setBusiness={setBusiness} businessSaved={businessSaved} setBusinessSaved={setBusinessSaved} />}
            <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-[#ece9e2] pt-4 text-[9px] text-[#aaa59a]"><span>Club Huella · Panel de prueba</span><span>Métricas y datos simulados · No conectado a producción</span></footer>
          </main>
        </div>
      </div>
      <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
