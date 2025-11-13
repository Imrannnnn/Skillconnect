import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/auth.js";
import API from "../api/axios.js";
import { NetBus } from "../api/axios.js";

export default function Header() {
  const auth = useContext(AuthContext);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (auth?.user?.role === 'provider' && auth?.user?._id) {
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
  }, [auth?.user?.role, auth?.user?._id]);

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
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="text-emerald-700 font-semibold">
          SkillConnect
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/providers" className="text-gray-700 hover:text-emerald-700 transition-all">Providers</Link>
          <Link to="/about" className="text-gray-700 hover:text-emerald-700 transition-all">About</Link>
          <Link to="/chats" className="relative text-gray-700 hover:text-emerald-700 transition-all">
            Chats
            {unreadChats > 0 && (
              <span className="absolute -top-2 -right-3 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-600 text-white">{unreadChats}</span>
            )}
          </Link>
          {auth?.user?.role === 'provider' && (
            <Link to="/provider/bookings" className="relative text-gray-700 hover:text-emerald-700 transition-all">
              Bookings
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-3 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">{pendingCount}</span>
              )}
            </Link>
          )}
          {auth?.user?.role === 'client' && (
            <Link to="/bookings" className="text-gray-700 hover:text-emerald-700 transition-all">My bookings</Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3">
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
