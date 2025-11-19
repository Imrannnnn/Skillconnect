import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/auth.js";
import API from "../api/axios.js";
import { NetBus } from "../api/axios.js";
import { useToast } from "./toast.js";

export default function Header() {
  const auth = useContext(AuthContext);
  const roles = useMemo(() => {
    const user = auth?.user;
    if (!user) return [];
    if (Array.isArray(user.roles) && user.roles.length) return user.roles;
    return user.role ? [user.role] : [];
  }, [auth?.user]);
  const accountType = auth?.user?.accountType || "individual";
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [resending, setResending] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { notify } = useToast();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (roles.includes('provider') && auth?.user?._id) {
          const { data } = await API.get(`/bookings?providerId=${auth.user._id}`);
          const list = Array.isArray(data?.bookings) ? data.bookings : [];
          const count = list.filter((b) => b?.status === 'pending').length;
          if (mounted) setPendingCount(count);
        } else {
          if (mounted) setPendingCount(0);
        }
      } catch {
        if (mounted) setPendingCount(0);
      }
    }
    load();
    const unsub = NetBus.subscribe((s) => {
      if (s?.bookingsUpdated) load();
    });
    return () => { mounted = false; unsub?.(); };
  }, [auth?.user?._id, roles]);

  // Unread chats total
  useEffect(() => {
    function compute() {
      try {
        const obj = JSON.parse(localStorage.getItem('unreadCounts') || '{}');
        const total = Object.values(obj).reduce((a, b) => a + (Number(b) || 0), 0);
        setUnreadChats(total);
      } catch {
        setUnreadChats(0);
      }
    }
    compute();
    const unsub = NetBus.subscribe((s) => {
      if (s?.chatsUpdated) compute();
    });
    const onStorage = (e) => { if (e.key === 'unreadCounts') compute(); };
    window.addEventListener('storage', onStorage);
    return () => { unsub?.(); window.removeEventListener('storage', onStorage); };
  }, []);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      {auth?.user && auth.user.verified === false && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 py-1 text-xs text-amber-800 flex items-center justify-between gap-2">
            <span>
              Please verify your email address. We sent a verification link to <span className="font-semibold">{auth.user.email}</span>.
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Check your inbox or spam folder.</span>
              <button
                type="button"
                disabled={resending}
                onClick={async () => {
                  if (!auth?.user?.email) return;
                  try {
                    setResending(true);
                    await API.post("/auth/resend-verification", { email: auth.user.email });
                    notify("If an account exists for this email, a new verification link has been sent.", { type: 'success' });
                  } catch (e) {
                    notify(e?.response?.data?.message || "Failed to resend verification link", { type: 'error' });
                  } finally {
                    setResending(false);
                  }
                }}
                className="px-2 py-1 rounded-md border border-amber-300 bg-amber-100 text-amber-800 text-[11px] hover:bg-amber-200 disabled:opacity-60"
              >
                {resending ? "Sending…" : "Resend link"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="text-emerald-700 font-semibold" onClick={() => setMobileOpen(false)}>
          SkillConnect
        </Link>
        <nav className="hidden md:flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <Link to="/providers" className="text-gray-700 hover:text-emerald-700 transition-all">Providers</Link>
          <Link to="/about" className="text-gray-700 hover:text-emerald-700 transition-all">About</Link>
          <Link to="/chats" className="relative text-gray-700 hover:text-emerald-700 transition-all">
            Chats
            {unreadChats > 0 && (
              <span className="absolute -top-2 -right-3 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-600 text-white">{unreadChats}</span>
            )}
          </Link>
          {roles.includes('provider') && (
            <Link to="/provider/bookings" className="relative text-gray-700 hover:text-emerald-700 transition-all">
              Bookings
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-3 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">{pendingCount}</span>
              )}
            </Link>
          )}
          {roles.includes('client') && (
            <Link to="/bookings" className="text-gray-700 hover:text-emerald-700 transition-all">My bookings</Link>
          )}
        </nav>
        <label className="burger ml-auto md:hidden" htmlFor="main-burger">
          <input
            type="checkbox"
            id="main-burger"
            checked={mobileOpen}
            onChange={(e) => setMobileOpen(e.target.checked)}
            aria-label="Toggle navigation"
          />
          <span />
          <span />
          <span />
        </label>
        <div className="ml-auto hidden md:flex items-center gap-3">
          {!auth?.user && (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm text-emerald-700 hover:text-emerald-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
          {auth?.user && (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full overflow-hidden bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                {auth?.user?.avatarUrl ? (
                  <img src={auth.user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  (auth?.user?.name?.[0] || auth?.user?.email?.[0] || 'U').toUpperCase()
                )}
              </div>
              <span className="text-sm text-gray-700 max-w-[200px] truncate" title={auth?.user?.name || auth?.user?.email}>
                {auth?.user?.name || auth?.user?.email}
              </span>
              {roles.includes('admin') && (
                <Link
                  to="/admin/forms"
                  className="text-xs text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-50"
                >
                  Admin forms
                </Link>
              )}
              <Link
                to="/settings/account"
                className="text-xs text-gray-600 hover:text-emerald-700 px-2 py-1 rounded-md border border-transparent hover:border-emerald-200 hover:bg-emerald-50"
              >
                Account settings
              </Link>
              {accountType === 'organization' && (
                <Link
                  to="/org/dashboard"
                  className="text-xs text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-50"
                >
                  Org dashboard
                </Link>
              )}
              {roles.includes('provider') && (
                <Link
                  to="/provider/dashboard"
                  className="text-xs text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-50"
                >
                  My dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={() => { auth.logout(); navigate('/'); setMobileOpen(false); }}
                className="ml-2 px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 text-sm">
            <nav className="flex flex-col gap-2">
              <Link to="/providers" className="text-gray-700 hover:text-emerald-700" onClick={() => setMobileOpen(false)}>Providers</Link>
              <Link to="/about" className="text-gray-700 hover:text-emerald-700" onClick={() => setMobileOpen(false)}>About</Link>
              <Link to="/chats" className="text-gray-700 hover:text-emerald-700" onClick={() => setMobileOpen(false)}>Chats</Link>
              {roles.includes('provider') && (
                <Link to="/provider/bookings" className="text-gray-700 hover:text-emerald-700" onClick={() => setMobileOpen(false)}>Bookings</Link>
              )}
              {roles.includes('client') && (
                <Link to="/bookings" className="text-gray-700 hover:text-emerald-700" onClick={() => setMobileOpen(false)}>My bookings</Link>
              )}
            </nav>
            <div className="mt-2 flex flex-col gap-2">
              {!auth?.user && (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-sm text-emerald-700 hover:text-emerald-800"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
              {auth?.user && (
                <>
                  {roles.includes('admin') && (
                    <Link
                      to="/admin/forms"
                      className="text-xs text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Admin forms
                    </Link>
                  )}
                  {accountType === 'organization' && (
                    <Link
                      to="/org/dashboard"
                      className="text-xs text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Org dashboard
                    </Link>
                  )}
                  {roles.includes('provider') && (
                    <Link
                      to="/provider/dashboard"
                      className="text-xs text-emerald-700 hover:text-emerald-800 px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      My dashboard
                    </Link>
                  )}
                  <Link
                    to="/settings/account"
                    className="text-xs text-gray-700 hover:text-emerald-700 px-2 py-1 rounded-md border border-gray-200 hover:bg-emerald-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    Account settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => { auth.logout(); navigate('/'); setMobileOpen(false); }}
                    className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-left"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
