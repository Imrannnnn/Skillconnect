import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { getImageUrl } from '../utils/image';

export default function Sidebar({ isOpen, toggle }) {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const navItems = [
        { label: 'Home', path: '/', icon: '🏠' },
        { label: 'Feed', path: '/feed', icon: '📰' },
        { label: 'Providers', path: '/providers', icon: '🔍' },
        { label: 'Events', path: '/events', icon: '📅' },
    ];

    if (user) {
        navItems.push({ label: 'Dashboard', path: '/dashboard', icon: '📊' });
        if (user.providerMode) {
            navItems.push({ label: 'Provider Dashboard', path: '/provider/dashboard', icon: '💼' });
        }
        navItems.push({ label: 'My Bookings', path: '/bookings', icon: '📅' });
        navItems.push({ label: 'My Events', path: '/my-events', icon: '🎟️' });
        navItems.push({ label: 'Chats', path: '/chats', icon: '💬' });
        navItems.push({ label: 'Wallet', path: '/payments', icon: '💳' });
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20 hover:lg:w-64 group'}
        `}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                        <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
                            SC
                        </div>
                        <span className="font-bold text-xl text-emerald-900 opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            SkillConnect
                        </span>
                    </Link>
                    <button onClick={toggle} className="lg:hidden text-gray-500">
                        ✕
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 1024 && toggle()}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap overflow-hidden
                ${isActive(item.path)
                                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
                            title={item.label}
                        >
                            <span className="text-xl shrink-0 w-6 text-center">{item.icon}</span>
                            <span className="opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </nav>

                {/* User Footer */}
                {user ? (
                    <div className="p-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                            <img
                                src={getImageUrl(user.avatarUrl)}
                                alt={user.name}
                                className="h-9 w-9 rounded-full bg-gray-200 object-cover shrink-0 border border-gray-200"
                            />
                            <div className="flex flex-col opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
                                <button onClick={logout} className="text-xs text-rose-600 text-left hover:underline">
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border-t border-gray-100 flex flex-col gap-2 opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-75">
                        <Link to="/login" className="w-full py-2 rounded-md bg-gray-100 text-gray-700 text-sm font-medium text-center hover:bg-gray-200">
                            Log in
                        </Link>
                        <Link to="/register" className="w-full py-2 rounded-md bg-emerald-600 text-white text-sm font-medium text-center hover:bg-emerald-700">
                            Sign up
                        </Link>
                    </div>
                )}
            </aside>
        </>
    );
}
