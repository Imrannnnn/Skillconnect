import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImg from "../assets/ayaz-lalani-no-EShQ7s1A-unsplash.jpg";
import API from "../api/axios.js";

export default function Home() {
  const categories = ["Plumber", "Driver", "Cook", "Fashion designer", "Cleaner"];
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [organizationsError, setOrganizationsError] = useState("");

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
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero section */}
      <section
        className="relative w-full h-[60vh] flex items-center justify-center text-white"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
          <div className="absolute inset-0 bg-emerald-900/70" />
          <div className="relative z-10 text-center max-w-2xl px-6">
            <h1 className="text-3xl md:text-5xl font-bold drop-shadow-lg">Need Help? Get Help!</h1>
            <p className="text-base md:text-lg mt-3 opacity-90">
              Find trusted service providers around you — fast, easy, and secure.
            </p>
            <p className="mt-1 text-sm md:text-base opacity-90">
              Become a provider and offer your services to thousands of clients.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/providers"
                className="px-5 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm md:text-base font-medium shadow-md"
              >
                Find providers
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-md border border-emerald-200 bg-white/10 text-white text-sm md:text-base font-medium hover:bg-white/20"
              >
                Become a provider
              </Link>
            </div>
          </div>
        </section>

      {/* Core value cards (Find / Book / Chat) */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-3 gap-6 md:gap-8">
          {[ 
            {
              title: "Find providers",
              desc: "Search for verified and trusted local providers easily.",
            },
            {
              title: "Book the closest",
              desc: "Use smart matching and distance filters to reach nearby talent.",
            },
            {
              title: "Chat & complete",
              desc: "Message providers directly and complete your service smoothly.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="group relative bg-white px-6 sm:px-8 py-8 sm:py-10 rounded-xl shadow-sm border border-emerald-100 hover:border-emerald-500 transition"
            >
              <div className="absolute inset-0 rounded-xl border border-emerald-500 opacity-0 group-hover:opacity-100 blur-md transition" />
              <div className="relative z-10 text-center">
                <div className="mx-auto mb-4 h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-semibold">
                  {card.title[0]}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{card.title}</h3>
                <p className="text-sm text-gray-600">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Find organizations</h2>
              <p className="mt-1 text-sm text-gray-600">Find organization to what you need.</p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Create organization account
            </Link>
          </div>

          {loadingOrganizations && (
            <p className="text-sm text-gray-500">Loading organizations...</p>
          )}

          {!loadingOrganizations && organizationsError && (
            <p className="text-sm text-rose-600">{organizationsError}</p>
          )}

          {!loadingOrganizations && !organizationsError && (
            <>
              {organizations.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No organizations are visible yet. Organizations that sign up will appear here.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organizations.slice(0, 6).map((org) => (
                    <Link
                      key={org._id}
                      to={`/org/${org.slug || org._id}`}
                      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-emerald-500 hover:shadow-md transition"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        {org.logo && (
                          <div className="h-10 w-10 flex-shrink-0 rounded-md border border-gray-200 bg-white overflow-hidden">
                            <img
                              src={org.logo}
                              alt={`${org.name} logo`}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 group-hover:text-emerald-700 truncate">
                            {org.name}
                          </h3>
                          {org.sector && (
                            <p className="mt-0.5 text-xs uppercase tracking-wide text-emerald-700 truncate">
                              {org.sector}
                            </p>
                          )}
                        </div>
                      </div>
                      {org.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-3">
                          {org.description}
                        </p>
                      )}
                      {org.slug && (
                        <span className="mt-3 text-xs font-medium text-emerald-700">
                          View organization
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* About / Why SkillConnect section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid gap-8 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">About SkillConnect</h2>
            <p className="mt-3 text-gray-600 leading-relaxed text-sm md:text-base">
              SkillConnect is a marketplace designed to help clients discover, evaluate, and hire trusted service
              providers. Chat, bookings, payments, and reviews live in one place so work moves faster and feels safer.
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✓</span>
                <span>Verified providers with transparent profiles and badges.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✓</span>
                <span>Secure wallet and escrow so payments are protected.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600">✓</span>
                <span>Location and smart search to match you with the right person quickly.</span>
              </li>
            </ul>
          </div>
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1556761175-129418cb2dfe?q=80&w=1470&auto=format&fit=crop"
              alt="People collaborating"
              className="w-full h-64 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Quick categories + how it works */}
      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid gap-8 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Popular categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.map((c) => (
                <Link
                  key={c}
                  to={`/providers?category=${encodeURIComponent(c)}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-center text-sm font-medium text-gray-800 shadow-sm hover:shadow-md hover:border-emerald-500 transition"
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How it works</h2>
            <div className="space-y-3 text-sm">
              {[ 
                { title: 'Search & match', desc: 'Use smart search and filters to find providers.' },
                { title: 'Chat & agree', desc: 'Discuss requirements, timelines, and pricing.' },
                { title: 'Book & track', desc: 'Send a booking, follow the job timeline, and release payment securely.' },
              ].map((step, i) => (
                <div key={step.title} className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{step.title}</div>
                    <div className="text-gray-600 text-xs mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
