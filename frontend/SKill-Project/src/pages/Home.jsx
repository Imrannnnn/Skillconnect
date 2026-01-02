import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios.js";
import { getImageUrl } from "../utils/image.js";

export default function Home() {
  const categories = ["Plumber", "Developer", "Designer", "Cleaner", "Tutor", "Chef", "Event Planner", "Mechanic"];
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [organizationsError, setOrganizationsError] = useState("");
  const [communityItems, setCommunityItems] = useState([]);
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const [communityError, setCommunityError] = useState("");

  const stats = [
    { label: "Providers", value: "500+" },
    { label: "Products", value: "1.2k" },
    { label: "Events", value: "300+" },
    { label: "Community", value: "10k+" },
  ];

  function formatShortDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
        new Date(value),
      );
    } catch {
      return "";
    }
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoadingOrganizations(true);
      setOrganizationsError("");
      try {
        const { data } = await API.get("/organizations/public");
        if (!mounted) return;
        const list = Array.isArray(data?.organizations) ? data.organizations : [];
        setOrganizations(list);
      } catch {
        if (!mounted) return;
        setOrganizationsError("Failed to load organizations.");
      } finally {
        if (mounted) setLoadingOrganizations(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadCommunity() {
      setLoadingCommunity(true);
      setCommunityError("");
      try {
        const { data } = await API.get("/content?limit=3");
        if (!mounted) return;
        const list = Array.isArray(data?.contents) ? data.contents : [];
        setCommunityItems(list);
      } catch {
        if (!mounted) return;
        setCommunityError("Failed to load community content.");
      } finally {
        if (mounted) setLoadingCommunity(false);
      }
    }
    loadCommunity();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">

      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden bg-gray-900 text-white">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6 lg:px-8 mt-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-sm mb-6 border border-emerald-500/30 backdrop-blur-sm">
            The #1 Platform for Global Talent
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
            Connect. Collaborate. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Grow.</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Find expert providers, attend exclusive events, and buy verified digital products.
            All in one seamless ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/providers" className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg transition shadow-lg shadow-emerald-900/20">
              Find Talent
            </Link>
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-lg transition backdrop-blur-md">
              Start Selling
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 opacity-80 border-t border-white/10 pt-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className="text-xs uppercase tracking-widest text-gray-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center space-x-2 md:space-x-4">
          <span className="text-sm font-semibold text-gray-400 whitespace-nowrap mr-2 hidden md:inline">Popular:</span>
          {categories.map((cat) => (
            <Link key={cat} to={`/providers?category=${encodeURIComponent(cat)}`} className="px-4 py-1.5 rounded-full bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-sm font-medium text-gray-600 transition whitespace-nowrap">
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything You Need</h2>
            <p className="mt-4 text-lg text-gray-600">Access a suite of tools designed to accelerate your success.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Link to="/providers" className="group rounded-2xl bg-gray-50 border border-gray-100 p-8 hover:bg-emerald-50/50 hover:border-emerald-200 transition duration-300">
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">💼</div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700">Find Professionals</h3>
              <p className="mt-3 text-gray-600">Hire certified experts for any job. From plumbing to software development, we've got you covered.</p>
            </Link>

            {/* Feature 2 */}
            <Link to="/digital-marketplace" className="group rounded-2xl bg-gray-50 border border-gray-100 p-8 hover:bg-blue-50/50 hover:border-blue-200 transition duration-300">
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">🛍️</div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700">Digital Marketplace</h3>
              <p className="mt-3 text-gray-600">Buy high-quality templates, e-books, and assets instantly. Secure delivery to your library.</p>
            </Link>

            {/* Feature 3 */}
            <Link to="/events" className="group rounded-2xl bg-gray-50 border border-gray-100 p-8 hover:bg-purple-50/50 hover:border-purple-200 transition duration-300">
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">🎫</div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700">Events & Networking</h3>
              <p className="mt-3 text-gray-600">Discover local workshops, seminars, and networking events. Book tickets with ease.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Organizations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Organizations</h2>
              <p className="mt-2 text-gray-600">Top verified companies hiring and offering services.</p>
            </div>
            <Link to="/providers" className="hidden sm:inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700">
              View All <span className="ml-1">→</span>
            </Link>
          </div>

          {!loadingOrganizations && !organizationsError && organizations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {organizations.slice(0, 4).map((org) => (
                <Link key={org._id} to={`/org/${org.slug || org._id}`} className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                  <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                    {org.logo ? (
                      <img src={getImageUrl(org.logo)} alt={org.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    ) : (
                      <div className="text-4xl opacity-20 font-bold text-gray-400">{org.name[0]}</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition"></div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 truncate">{org.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-emerald-600 mt-1 mb-3">{org.sector || "General"}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{org.description || "No description available."}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No organizations featured yet. Be the first to join!</p>
              <Link to="/register" className="inline-block mt-4 text-emerald-600 font-medium">Register as Organization</Link>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link to="/providers" className="text-emerald-600 font-bold">View All Organizations →</Link>
          </div>
        </div>
      </section>

      {/* Community Updates */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Community Pulse</h2>
            <p className="mt-3 text-gray-600">The latest stories, tips, and updates from our vibrant network.</p>
          </div>

          {!loadingCommunity && !communityError && communityItems.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {communityItems.map((item) => (
                <Link key={item._id} to={`/feed/${item._id}`} className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase">
                      {item.contentType || "Update"}
                    </div>
                    <span className="text-xs text-gray-400">{formatShortDate(item.createdAt)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{item.title || "Untitled Post"}</h3>
                  <p className="text-gray-600 line-clamp-3 mb-4 flex-1">{item.body}</p>
                  <div className="text-emerald-600 font-medium text-sm mt-auto">Read More →</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No updates yet.</p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link to="/feed" className="px-8 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">
              View Community Feed
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500 rounded-full blur-[120px] opacity-20"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Workflow?</h2>
          <p className="text-xl text-emerald-100 mb-10">Join thousands of freelancers, agencies, and businesses building the future on SkillConnect.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="px-10 py-4 rounded-full bg-white text-emerald-900 font-bold text-lg hover:bg-gray-100 transition shadow-xl">
              Get Started for Free
            </Link>
            <Link to="/about" className="px-10 py-4 rounded-full bg-transparent border border-white text-white font-bold text-lg hover:bg-white/10 transition">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
