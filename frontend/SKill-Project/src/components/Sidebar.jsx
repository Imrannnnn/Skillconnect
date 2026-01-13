import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { getImageUrl } from '../utils/image';

export default function Sidebar({ isOpen, toggle }) {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const [openGroups, setOpenGroups] = useState({ discover: true, myZone: true, provider: true, org: true });
    const [isHovered, setIsHovered] = useState(false);

    const toggleGroup = (key) => {
        setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const NavItem = ({ label, path, icon }) => (
        <Link
            to={path}
            onClick={() => window.innerWidth < 1024 && toggle()}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 whitespace-nowrap overflow-hidden group/item
                ${isActive(path)
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/50'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}
            `}
            title={label}
        >
            <span className={`text-xl shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-transform group-hover/item:scale-110 ${isActive(path) ? 'text-white' : 'text-emerald-600'}`}>
                {icon}
            </span>
            <span className={`text-sm font-medium transition-all duration-300 ${isHovered || isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                {label}
            </span>
        </Link>
    );

    const NavGroup = ({ title, groupKey, children }) => {
        const isExpanded = isHovered || isOpen;
        return (
            <div className="mt-4 first:mt-0">
                <button
                    onClick={() => toggleGroup(groupKey)}
                    className={`w-full flex items-center justify-between px-3 py-1 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-emerald-600 transition-colors ${!isExpanded ? 'justify-center' : ''}`}
                    title={title}
                >
                    {isExpanded ? (
                        <>
                            <span className="truncate">{title}</span>
                            <span className={`transform transition-transform duration-300 ${openGroups[groupKey] ? 'rotate-180' : ''}`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </span>
                        </>
                    ) : (
                        <div className="h-0.5 w-4 bg-gray-200 rounded-full" />
                    )}
                </button>
                {openGroups[groupKey] && (
                    <div className={`flex flex-col gap-1 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-100'}`}>
                        {children}
                    </div>
                )}
            </div>
        );
    };

    const sidebarWidth = isOpen ? 'w-72' : (isHovered ? 'w-72' : 'lg:w-0 w-0');

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
                    onClick={toggle}
                />
            )}

            {/* Floating Burger Trigger for Desktop (when collapsed & not hovered) */}
            {!isOpen && (
                <div
                    onMouseEnter={() => setIsHovered(true)}
                    className={`fixed top-4 left-4 z-[80] hidden lg:flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur border border-gray-200/50 rounded-full shadow-lg cursor-pointer text-emerald-600 hover:text-emerald-700 hover:scale-110 transition-all duration-300 ${isHovered ? 'opacity-0 scale-50 pointer-events-none translate-x-10' : 'opacity-100 scale-100 translate-x-0'}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </div>
            )}

            {/* Sidebar */}
            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`fixed top-0 left-0 h-full bg-white/80 backdrop-blur-xl border-r border-gray-200/50 z-[70] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col shadow-2xl
                    ${sidebarWidth} ${!isOpen && !isHovered ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
                `}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center px-4 mb-2">
                    <Link to="/" className="flex items-center gap-3 overflow-hidden">
                        <div className="min-w-[40px] h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200 shrink-0">
                            SC
                        </div>
                        <span className={`font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-900 to-emerald-700 transition-all duration-300 ${isHovered || isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                            SkillConnect
                        </span>
                    </Link>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none hover:scrollbar-thin scrollbar-thumb-emerald-100 scrollbar-track-transparent">

                    {/* Core Navigation (Mobile Only/Collapsed Shortcut) */}
                    <div className="lg:hidden mb-6 flex flex-col gap-1">
                        <NavItem label="Home" path="/" icon="🏠" />
                        <NavItem label="Feed" path="/feed" icon="📰" />
                        {user && <NavItem label="Notifications" path="/notifications" icon="🔔" />}
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Discover Group */}
                        <NavGroup title="Explore" groupKey="discover">
                            <NavItem label="Providers" path="/providers" icon="🔍" />
                            <NavItem label="Marketplace" path="/digital-marketplace" icon="🛍️" />
                            <NavItem label="Events" path="/events" icon="📅" />
                        </NavGroup>

                        {/* My Zone */}
                        {user && (
                            <NavGroup title="My Zone" groupKey="myZone">
                                <NavItem label="My Library" path="/my-digital-library" icon="📚" />
                                <NavItem label="My Bookings" path="/bookings" icon="🗓️" />
                                <NavItem label="My Events" path="/my-events" icon="🎟️" />
                                <NavItem label="Chats" path="/chats" icon="💬" />
                                <NavItem label="Wallet" path="/payments" icon="💳" />
                            </NavGroup>
                        )}

                        {/* Business Tools */}
                        {user && (user.roles?.includes('provider') || user.accountType === 'organization') && (
                            <NavGroup title="Business" groupKey="provider">
                                {user.roles?.includes('provider') && (
                                    <>
                                        <NavItem label="Provider Dashboard" path="/provider/dashboard" icon="💼" />
                                        <NavItem label="Digital Sales" path="/max-seller/digital" icon="📈" />
                                    </>
                                )}
                                {user.accountType === 'organization' && (
                                    <>
                                        <NavItem label="Org Dashboard" path="/org/dashboard" icon="🏢" />
                                        <NavItem label="Organizer Events" path="/organizer/events" icon="📋" />
                                    </>
                                )}
                            </NavGroup>
                        )}
                    </div>
                </nav>

                {/* User Footer */}
                <div className="p-4 bg-gray-50/50 backdrop-blur-md border-t border-gray-100">
                    {user ? (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Link to="/settings/account" className="shrink-0 group/avatar">
                                <img
                                    src={getImageUrl(user.avatarUrl)}
                                    alt={user.name}
                                    className="h-10 w-10 rounded-xl bg-white object-cover border-2 border-white shadow-md group-hover/avatar:border-emerald-200 transition-all"
                                />
                            </Link>
                            <div className={`flex flex-col min-w-0 transition-all duration-300 ${isHovered || isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                                <span className="text-sm font-bold text-gray-900 truncate">{user.name}</span>
                                <button onClick={logout} className="text-xs text-rose-500 font-medium hover:text-rose-600 transition-colors text-left uppercase tracking-wider">
                                    Sign out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`flex flex-col gap-2 transition-all duration-300 ${isHovered || isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                            <Link to="/login" className="w-full py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-bold text-center hover:bg-gray-50 transition-all shadow-sm">
                                Log in
                            </Link>
                            <Link to="/register" className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold text-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50">
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
