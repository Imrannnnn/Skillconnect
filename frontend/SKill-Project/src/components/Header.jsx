import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/auth.js";
import API from "../api/axios.js";
import { NetBus } from "../api/axios.js";
import { useToast } from "./toast.js";
import { getImageUrl } from "../utils/image.js";

export default function Header({ minimal, toggleSidebar }) {
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [resending, setResending] = useState(false);
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

  // Notifications count
  useEffect(() => {
    let mounted = true;
    async function loadNotifs() {
      try {
        if (!auth?.user?._id) return;
        const { data } = await API.get('/notifications');
        if (mounted) setUnreadNotifications(data.unreadCount || 0);
      } catch {
        // ignore
      }
    }
    loadNotifs();
    // Poll or listen for events? 
    // Ideally socket should push this. For now let's poll every minute or listen to NetBus if implemented.
    // Assuming socket.js might emit 'notification' via NetBus or we rely on page refreshes/actions.
    const interval = setInterval(loadNotifs, 30000);
    const unsub = NetBus.subscribe((s) => {
      if (s?.notificationsUpdated) loadNotifs();
    });
    return () => { mounted = false; clearInterval(interval); unsub?.(); };
  }, [auth?.user?._id]);

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
        {/* Mobile Sidebar Toggle - visible only on mobile */}
        <button
          onClick={toggleSidebar}
          className="md:hidden text-gray-500 hover:text-emerald-600 focus:outline-none"
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        <Link to="/" className="text-emerald-700 font-semibold text-lg">
          SkillConnect
        </Link>
        {!minimal && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors">Home</Link>
            <Link to="/feed" className="text-gray-600 hover:text-emerald-600 transition-colors">Feed</Link>
            <Link to="/providers" className="text-gray-600 hover:text-emerald-600 transition-colors">Find Providers</Link>
            <Link to="/events" className="text-gray-600 hover:text-emerald-600 transition-colors">Events</Link>
            <Link to="/about" className="text-gray-600 hover:text-emerald-600 transition-colors">About</Link>
          </nav>
        )}

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
            <div className="flex items-center gap-3 relative group">
              <Link to="/notifications" className="relative text-gray-500 hover:text-emerald-600 transition-colors" title="Notifications">
                <svg className={`w-6 h-6 ${unreadNotifications > 0 ? 'animate-shake text-emerald-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center text-[9px] rounded-full bg-rose-500 text-white font-medium ring-2 ring-white">{unreadNotifications}</span>
                )}
              </Link>
              <Link to="/chats" className="relative text-gray-500 hover:text-emerald-600 transition-colors" title="Messages">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                {unreadChats > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center text-[9px] rounded-full bg-rose-500 text-white font-medium ring-2 ring-white">{unreadChats}</span>
                )}
              </Link>

              <div className="h-8 w-8 rounded-full overflow-hidden bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold ring-2 ring-transparent hover:ring-emerald-100 transition-all cursor-pointer">
                {auth?.user?.avatarUrl ? (
                  <img src={getImageUrl(auth.user.avatarUrl)} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  (auth?.user?.name?.[0] || auth?.user?.email?.[0] || 'U').toUpperCase()
                )}
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{auth?.user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{auth?.user?.email}</p>
                </div>

                {roles.includes('admin') && (
                  <Link to="/admin/forms" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">Admin Dashboard</Link>
                )}
                {accountType === 'organization' && (
                  <Link to="/org/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">Organization Dashboard</Link>
                )}
                {roles.includes('provider') && (
                  <Link to="/provider/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">Provider Dashboard</Link>
                )}

                <div className="my-1 border-t border-gray-50"></div>

                {roles.includes('client') && (
                  <Link to="/bookings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">My Bookings</Link>
                )}
                {roles.includes('provider') && (
                  <Link to="/provider/bookings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">
                    {auth?.user?.providerMode === 'product' ? 'Client Orders' : 'Client Bookings'}
                    {pendingCount > 0 && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
                  </Link>
                )}



                <div className="my-1 border-t border-gray-50"></div>

                <Link to="/settings/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600">Settings</Link>
                <button
                  onClick={() => { auth.logout(); navigate('/'); }}
                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
