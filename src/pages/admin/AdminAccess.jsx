import React, { useEffect, useState } from 'react';
import { FiLock, FiLogIn } from 'react-icons/fi';
import UnifiedAdminPanel from './UnifiedAdminPanel';
import { fetchAdminSession, loginAdmin, logoutAdmin } from '../../lib/adminSession';

export default function AdminAccess() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAdminSession()
      .then((session) => { if (active) setAuthenticated(Boolean(session.authenticated)); })
      .catch(() => { if (active) setError('No se pudo contactar el servicio de administración.'); })
      .finally(() => { if (active) setReady(true); });
    const expire = () => {
      setAuthenticated(false);
      setError('La sesión venció. Ingresá nuevamente.');
    };
    window.addEventListener('clubhuella-admin-session-expired', expire);
    return () => {
      active = false;
      window.removeEventListener('clubhuella-admin-session-expired', expire);
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await loginAdmin(username, password);
      setAuthenticated(true);
      setPassword('');
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try { await logoutAdmin(); }
    catch { /* Se cierra la vista local aunque el servidor ya haya vencido la sesión. */ }
    setAuthenticated(false);
    setPassword('');
  }

  if (!ready) return <main className="grid min-h-screen place-items-center bg-[#f4f0e8] text-sm text-[#777166]">Verificando acceso…</main>;
  if (authenticated) return <UnifiedAdminPanel onLogout={handleLogout} />;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f0e8] px-5 py-10 text-[#33342f]">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#e9d9c8]/60 blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#dfe7dc]/70 blur-3xl" />
      <form onSubmit={handleLogin} className="relative z-10 w-full max-w-[400px] rounded-[28px] border border-white/80 bg-white/95 p-7 shadow-[0_24px_80px_rgba(78,62,40,0.12)] sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#9a4e2f] text-xl text-white"><FiLock /></div>
          <div><div className="font-serif text-[21px] font-semibold">Club Huella</div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a59c8d]">Administración</div></div>
        </div>
        <h1 className="font-serif text-[28px]">Ingresá al panel</h1>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[#8c887e]">Acceso protegido para consultar y administrar pedidos.</p>
        <label className="mb-4 mt-6 block text-[11px] font-semibold text-[#67655d]">Usuario
          <input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border-[#e8e3d9] bg-[#fdfcf9] px-3 text-sm focus:border-[#9a4e2f] focus:ring-[#9a4e2f]/20" />
        </label>
        <label className="block text-[11px] font-semibold text-[#67655d]">Contraseña
          <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border-[#e8e3d9] bg-[#fdfcf9] px-3 text-sm focus:border-[#9a4e2f] focus:ring-[#9a4e2f]/20" />
        </label>
        {error && <div role="alert" className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] leading-relaxed text-rose-700">{error}</div>}
        <button disabled={submitting} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#914c30] text-xs font-semibold text-white transition hover:bg-[#783d27] disabled:opacity-50"><FiLogIn />{submitting ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </main>
  );
}
