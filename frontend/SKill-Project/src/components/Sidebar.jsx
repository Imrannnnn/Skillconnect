import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { getImageUrl } from '../utils/image';

// Icons as a cleaner internal component set
const Icons = {
    Home: () => <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    Feed: () => <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />,
    Bell: () => <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />,
    Search: () => <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
    ShoppingBag: () => <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
    Calendar: () => <><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></>,
    Book: () => <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    MessageSquare: () => <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z" />,
    CreditCard: () => <><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></>,
    Briefcase: () => <><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    TrendingUp: () => <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
    Building: () => <><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M16 18h.01" /></>,
    ChevronRight: () => <path d="m9 18 6-6-6-6" />,
    ChevronLeft: () => <path d="m15 18-6-6 6-6" />,
    Menu: () => <><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></>,
    LogOut: () => <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></>,
    User: () => <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    X: () => <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
    ChevronDown: () => <path d="m6 9 6 6 6-6" />
}

const Icon = ({ name, className }) => {
    const Component = Icons[name] || Icons.Home;
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <Component />
        </svg>
    )
}

export default function Sidebar({ isOpen, toggle }) {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (title) => {
        setExpandedGroups(prev => ({
            ...prev,
            [title]: !(prev[title] ?? true)
        }));
    };

    const isGroupExpanded = (title) => expandedGroups[title] !== false;

    // Navigation Groups
    const navGroups = [
        {
            title: "Discover",
            items: [
                { label: "Providers", path: "/providers", icon: "Search" },
                { label: "Marketplace", path: "/digital-marketplace", icon: "ShoppingBag" },
                { label: "Events", path: "/events", icon: "Calendar" },
            ]
        },
        user && {
            title: "My Zone",
            items: [
                { label: "My Library", path: "/my-digital-library", icon: "Book" },
                { label: "My Bookings", path: "/bookings", icon: "Calendar" },
                { label: "My Events", path: "/my-events", icon: "Calendar" },
                { label: "Chats", path: "/chats", icon: "MessageSquare" },
                { label: "Wallet", path: "/payments", icon: "CreditCard" },
            ]
        },
        user && (user.roles?.includes('provider') || user.accountType === 'organization') && {
            title: "Business",
            items: [
                ...(user.roles?.includes('provider') ? [
                    { label: "Provider Dashboard", path: "/provider/dashboard", icon: "Briefcase" },
                    { label: "Digital Sales", path: "/max-seller/digital", icon: "TrendingUp" },
                ] : []),
                ...(user.accountType === 'organization' ? [
                    { label: "Org Dashboard", path: "/org/dashboard", icon: "Building" },
                    { label: "Organizer Events", path: "/organizer/events", icon: "Briefcase" },
                ] : [])
            ]
        }
    ].filter(Boolean);

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggle}
            />

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 
                    transition-all duration-300 ease-in-out flex flex-col shrink-0
                    ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}
                `}
            >
                {/* Header / Logo */}
                <div className="h-16 flex items-center px-4 border-b border-gray-100 shrink-0 relative">
                    <Link to="/" className={`flex items-center gap-3 overflow-hidden ${!isOpen ? 'justify-center w-full' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-emerald-200 shadow-lg text-white font-bold">
                            SC
                        </div>
                        <span className={`font-bold text-xl text-gray-800 transition-opacity duration-300 whitespace-nowrap ${isOpen ? 'opacity-100 delay-100' : 'opacity-0 hidden'}`}>
                            SkillConnect
                        </span>
                    </Link>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={toggle}
                        className={`hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors shadow-sm z-50`}
                    >
                        <Icon name={isOpen ? "ChevronLeft" : "ChevronRight"} className="w-3 h-3" />
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={toggle}
                        className="lg:hidden ml-auto p-1 text-gray-500 hover:text-gray-800"
                    >
                        <Icon name="X" className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Nav */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                    {/* Core / Mobile Only Items */}
                    <div className="space-y-1">
                        <NavItem
                            to="/"
                            icon="Home"
                            label="Home"
                            active={isActive('/')}
                            expanded={isOpen}
                            onClick={() => window.innerWidth < 1024 && toggle()}
                        />
                        <NavItem
                            to="/feed"
                            icon="Feed"
                            label="Community Feed"
                            active={isActive('/feed')}
                            expanded={isOpen}
                            onClick={() => window.innerWidth < 1024 && toggle()}
                        />
                        {user && (
                            <NavItem
                                to="/notifications"
                                icon="Bell"
                                label="Notifications"
                                active={isActive('/notifications')}
                                expanded={isOpen}
                                onClick={() => window.innerWidth < 1024 && toggle()}
                            />
                        )}
                    </div>

                    {navGroups.map((group, idx) => {
                        const expanded = isGroupExpanded(group.title);
                        return (
                            <div key={idx} className="space-y-1">
                                {isOpen && (
                                    <button
                                        onClick={() => toggleGroup(group.title)}
                                        className="w-full flex items-center justify-between px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 whitespace-nowrap hover:text-gray-600 transition-colors focus:outline-none"
                                    >
                                        {group.title}
                                        <Icon
                                            name={expanded ? "ChevronDown" : "ChevronRight"}
                                            className="w-3 h-3 text-gray-400"
                                        />
                                    </button>
                                )}
                                <div className={`
                                    ${!isOpen ? 'pt-2 border-t border-gray-100' : ''}
                                    ${isOpen && !expanded ? 'hidden' : 'block'}
                                `}>
                                    {group.items.map((item, i) => (
                                        <NavItem
                                            key={i}
                                            to={item.path}
                                            icon={item.icon}
                                            label={item.label}
                                            active={isActive(item.path)}
                                            expanded={isOpen}
                                            onClick={() => window.innerWidth < 1024 && toggle()}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer / User Profile */}
                <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                    {user ? (
                        <div className={`flex items-center gap-3 ${isOpen ? 'px-2' : 'justify-center'}`}>
                            <Link to="/settings/account" className="shrink-0 relative group">
                                <img
                                    src={getImageUrl(user.avatarUrl)}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-emerald-500 transition-colors"
                                />
                            </Link>

                            {isOpen && (
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                                    <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {isOpen ? (
                                <>
                                    <Link to="/login" className="flex items-center justify-center w-full py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 whitespace-nowrap">Log In</Link>
                                    <Link to="/register" className="flex items-center justify-center w-full py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-700 whitespace-nowrap">Sign Up</Link>
                                </>
                            ) : (
                                <Link to="/login" className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600">
                                    <Icon name="User" className="w-5 h-5" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

function NavItem({ to, icon, label, active, expanded, onClick }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            title={!expanded ? label : ''}
            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                ${active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                ${!expanded ? 'justify-center' : ''}
            `}
        >
            <div className={`shrink-0 transition-colors ${active ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                <Icon name={icon} className="w-5 h-5" />
            </div>

            {expanded && (
                <span className="text-sm font-medium truncate">
                    {label}
                </span>
            )}

            {!expanded && active && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-600 rounded-l-full" />
            )}
        </Link>
    );
}
