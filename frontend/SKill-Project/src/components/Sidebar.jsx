import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { getImageUrl } from '../utils/image';

export default function Sidebar({ isOpen, toggle }) {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const [openGroups, setOpenGroups] = useState({ discover: true, myZone: true, provider: true, org: true });

    const toggleGroup = (key) => {
        setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const NavItem = ({ label, path, icon }) => (
        <Link
            to={path}
            onClick={() => window.innerWidth < 1024 && toggle()}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors whitespace-nowrap overflow-hidden
                ${isActive(path) ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
            title={label}
        >
            <span className="text-lg shrink-0 w-6 text-center">{icon}</span>
            <span className="text-sm opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-75">
                {label}
            </span>
        </Link>
    );

    const NavGroup = ({ title, groupKey, children }) => (
        <div className="mt-2">
            <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                title={title}
            >
                <span className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-75 truncate">{title}</span>
                <span className={`transform transition-transform duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 ${openGroups[groupKey] ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>
            {openGroups[groupKey] && (
                <div className="flex flex-col gap-0.5 mt-1 border-l-2 border-gray-100 ml-4 pl-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {children}
                </div>
            )}
            {/* Fallback for collapsed mode: Show children icons only? Or just hide? 
                When collapsed, we can't show nested easily. 
                Strategy: When collapsed (w-20), we only show pinned items? 
                OR we should flatten the list visually if collapsed?
                Actually, the CSS "opacity-0 group-hover:opacity-100" handles the text hiding.
                But the indent 'ml-4' might look weird if icons are hidden.
                Actually, let's keep it simple: When collapsed, the group header is hidden (opacity 0), 
                and the children are hidden?
                Wait, if user needs to click "Marketplace" and sidebar is narrow, they can't if it's inside a group that hides.
                
                BETTER UX for Collapsed Sidebar:
                - Always show all icons in a flat list?
                - OR, rely on the "hover to expand" behavior of this sidebar. 
                  (The sidebar classes: `w-64 -translate-x-full lg:translate-x-0 lg:w-20 hover:lg:w-64`)
                  So on desktop it is NARROW (w-20) until HOVER (w-64).
                  In narrow mode, we should perhaps just show the icons in a flat vertical list.
                  BUT if they are inside a conditional render `{openGroups && ...}`, they might be hidden.
                  
                  Fix: Force groups open or render fully when collapsed?
                  Actually, let's render the icons *outside* the collapsible structure if collapsed?
                  
                  Alternative: Just let the user hover to expand and THEN interact with groups.
                  In narrow mode (w-20), maybe we just show the Pinned icons?
                  User requested "icons that need to be at the top".
                  
                  Let's assume the user is okay with hovering to access deep items.
                  But for "Marketplace" which is important...
                  
                  Let's keep the groups logic, but ensure the "children" are rendered differently if sidebar is collapsed?
                  We can't detect "collapsed" easily in JS without resize listener, but we have CSS group-hover.
                  
                  Visual Tweak: Structure the JSX so that in narrow mode, the icons are visible?
                  This is hard with just CSS if the DOM is conditional.
                  
                  Decision: I will default groups to OPEN.
                  And I will hide the Group Header Title in narrow mode (already doing opacity-0).
                  The `ml-4` padding for children will shift icons to the right in expanded mode.
                  In narrow mode, `ml-4` might push icons off center.
                  
                  Let's remove indentation for icons? Or apply it only on group-hover.
                  
                  Actually, I'll allow the dropdowns. If the sidebar is narrow, the user sees mainly top icons.
                  To see more, they hover -> sidebar expands -> they see groups -> they can toggle.
                  This is cleaner.
            */}
        </div>
    );

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
                <div className="h-14 flex items-center justify-between px-3 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                        <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0 text-sm">
                            SC
                        </div>
                        <span className="font-bold text-lg text-emerald-900 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            SkillConnect
                        </span>
                    </Link>
                    <button onClick={toggle} className="lg:hidden text-gray-500">
                        ✕
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 overflow-y-auto py-2 flex flex-col px-2 scrollbar-thin scrollbar-thumb-gray-200 pb-20">

                    {/* Core Navigation (Mobile Only - Desktop has Header) */}
                    <div className="lg:hidden mb-2 border-b border-gray-100 pb-2">
                        <NavItem label="Home" path="/" icon="🏠" />
                        <NavItem label="Feed" path="/feed" icon="📰" />
                        {user && <NavItem label="Notifications" path="/notifications" icon="🔔" />}
                    </div>

                    {/* Discover Group */}
                    <NavGroup title="Discover" groupKey="discover">
                        <NavItem label="Providers" path="/providers" icon="🔍" />
                        <NavItem label="Marketplace" path="/digital-marketplace" icon="🛍️" />
                        <NavItem label="Events" path="/events" icon="📅" />
                    </NavGroup>

                    {/* My Zone */}
                    {user && (
                        <NavGroup title="My Zone" groupKey="myZone">
                            <NavItem label="My Library" path="/my-digital-library" icon="📚" />
                            <NavItem label="My Bookings" path="/bookings" icon="📅" />
                            <NavItem label="My Events" path="/my-events" icon="🎟️" />
                            <NavItem label="Chats" path="/chats" icon="💬" />
                            <NavItem label="Wallet" path="/payments" icon="💳" />
                        </NavGroup>
                    )}

                    {/* Provider Tools */}
                    {user && user.roles && (user.roles.includes('provider') || user.accountType === 'organization') && (
                        <NavGroup title="Business Tools" groupKey="provider">
                            {user.roles.includes('provider') && (
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
                            <div className="flex flex-col opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
                                <button onClick={logout} className="text-xs text-rose-600 text-left hover:underline">
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border-t border-gray-100 flex flex-col gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 delay-75">
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
