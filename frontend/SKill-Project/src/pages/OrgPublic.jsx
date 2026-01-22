import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios.js";
import { getImageUrl } from "../utils/image.js";

export default function OrgPublic() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewPage, setReviewPage] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const bookingForms = useMemo(() => {
    return Array.isArray(organization?.bookingForms) ? organization.bookingForms : [];
  }, [organization?.bookingForms]);

  const reviews = useMemo(() => {
    return Array.isArray(organization?.reviews) ? organization.reviews : [];
  }, [organization?.reviews]);

  const reviewPagination = useMemo(() => {
    const pageSize = 4;
    const total = reviews.length;
    const totalPages = Math.ceil(total / pageSize);
    const safePage = Math.min(Math.max(reviewPage, 0), Math.max(totalPages - 1, 0));
    const pageReviews = reviews.slice(safePage * pageSize, safePage * pageSize + pageSize);
    return { pageReviews, totalPages, safePage, total };
  }, [reviews, reviewPage]);

  useEffect(() => {
    if (reviewPagination.safePage !== reviewPage) {
      setReviewPage(reviewPagination.safePage);
    }
  }, [reviewPagination.safePage, reviewPage]);

  const orgId = organization?._id;
  useEffect(() => {
    setShowDetails(false);
  }, [orgId]);

  const ratingScore = typeof organization?.ratingScore === "number" ? organization.ratingScore : null;
  const ratingCount = typeof organization?.ratingCount === "number" ? organization.ratingCount : null;
  const hasRating = ratingScore !== null && ratingScore > 0;

  const hasExtendedDetails = useMemo(() => {
    if (!organization) return false;
    return (
      (Array.isArray(organization.services) && organization.services.length > 0) ||
      (Array.isArray(organization.projects) && organization.projects.length > 0) ||
      (Array.isArray(organization.reviews) && organization.reviews.length > 0) ||
      (Array.isArray(organization.partners) && organization.partners.length > 0) ||
      (Array.isArray(organization.media) && organization.media.length > 0) ||
      (Array.isArray(organization.certificates) && organization.certificates.length > 0) ||
      (Array.isArray(organization.updates) && organization.updates.length > 0) ||
      (Array.isArray(organization.teamMembers) && organization.teamMembers.length > 0) ||
      (Array.isArray(organization.achievements) && organization.achievements.length > 0)
    );
  }, [organization]);

  const createdAtDisplay = useMemo(() => {
    if (!organization?.createdAt) return "";
    const date = new Date(organization.createdAt);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString();
  }, [organization?.createdAt]);

  const hasContactInfo = Boolean(
    organization?.email || organization?.phone || organization?.website || organization?.address,
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await API.get(`/organizations/public/${slug}`);
        if (!mounted) return;
        setOrganization(data?.organization || null);
      } catch (e) {
        if (!mounted) return;
        const message = e?.response?.data?.message || "Organization not found";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (slug) {
      load();
    } else {
      setLoading(false);
      setError("Organization not found");
    }

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-sm text-gray-500">Loading organization...</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Organization</h1>
        <p className="text-sm text-rose-600 mb-4">{error || "Organization not found"}</p>
        <Link
          to="/"
          className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20 font-sans antialiased">
      {/* Premium Header Section */}
      <div className="bg-white border-b border-gray-100 shadow-sm relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-50/50 to-transparent -z-0"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl -z-0"></div>

        <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Organization Logo */}
            <div className="relative">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-[2rem] bg-white border border-gray-100 shadow-xl p-6 flex items-center justify-center overflow-hidden">
                {organization.logo ? (
                  <img
                    src={getImageUrl(organization.logo)}
                    alt={organization.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-4xl font-extrabold text-emerald-600 uppercase tracking-tighter">
                    {organization.name?.slice(0, 2) || "SC"}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-emerald-600 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Header Content */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] uppercase font-black tracking-widest rounded-lg">
                  {organization.sector || "Organization"}
                </span>
                {organization.verified && (
                  <span className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                    Verified Entity
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
                {organization.name}
              </h1>

              <p className="max-w-3xl text-xl font-medium text-gray-500 leading-relaxed">
                {organization.tagline || "Leading the way in innovation and sustainable growth."}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-xl">★</span>
                  <span className="text-gray-900 font-bold text-lg">{ratingScore?.toFixed(1) || "0.0"}</span>
                  <span className="text-gray-400 font-medium">({ratingCount || 0} Professional Reviews)</span>
                </div>
                <div className="h-4 w-px bg-gray-200 hidden md:block"></div>
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {organization.address?.split(',').pop() || "Global Operations"}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 w-full md:w-auto min-w-[240px] md:pt-4">
              <button
                className="w-full px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition-all"
                onClick={() => document.getElementById('booking-options')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Connect Organization
              </button>
              <a
                href={organization.website || "#"}
                target="_blank"
                className="w-full px-8 py-4 bg-white border border-gray-100 text-gray-900 font-bold rounded-2xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all text-center"
              >
                Visit Ecosystem
              </a>
              <button className="text-emerald-600 font-bold text-sm hover:underline py-2">
                View Open Opportunities →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Column: Mission & Metrics (Side Card style) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8 sticky top-24">
              <section className="space-y-4">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  {organization.description || "Building a future where technology and talent meet to create extraordinary value for everyone involved."}
                </p>
              </section>

              <section className="space-y-4 pt-6 border-t border-gray-50">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Ecosystem Impact</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-50">
                    <div className="text-3xl font-black text-emerald-600">5,000+</div>
                    <div className="text-sm font-bold text-gray-500 uppercase">Active Users</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-50">
                    <div className="text-3xl font-black text-teal-600">300+</div>
                    <div className="text-sm font-bold text-gray-500 uppercase">Verified Experts</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-50">
                    <div className="text-3xl font-black text-emerald-600">6</div>
                    <div className="text-sm font-bold text-gray-500 uppercase">Operating Regions</div>
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-6 border-t border-gray-50">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Connect</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-emerald-600">✉️</span>
                    <span className="font-semibold truncate">{organization.email || "hello@org.com"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-emerald-600">📞</span>
                    <span className="font-semibold">{organization.phone || "+1 (555) 000-0000"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-emerald-600">🗓</span>
                    <span className="font-semibold">Founded {new Date(organization.createdAt).getFullYear()}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Capabilities & Dynamic Feed */}
          <div className="lg:col-span-8 space-y-12">

            {/* Capabilities / Services */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Core Competencies</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.isArray(organization.services) && organization.services.length > 0 ? (
                  organization.services.map((svc, idx) => (
                    <div key={idx} className="group p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                        {idx % 2 === 0 ? "⚡️" : "🚀"}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{typeof svc === 'string' ? svc : svc.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {typeof svc === 'object' ? svc.description : "High-impact delivery tailored to specific organizational needs."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-10 text-center bg-gray-50 rounded-3xl text-gray-400 font-bold border-2 border-dashed border-gray-200">
                    Capabilities list arriving soon
                  </div>
                )}
              </div>
            </section>

            {/* Booking & Call to Action Section */}
            {bookingForms.length > 0 && (
              <section id="booking-options" className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Deployment Channels</h2>
                <div className="space-y-4">
                  {bookingForms.map((form) => (
                    <div key={form._id} className="group relative bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 hover:border-emerald-400 transition-all overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="h-20 w-20 rounded-3xl bg-emerald-600 text-white flex items-center justify-center text-3xl font-black shrink-0 relative z-10">
                        {form.name?.[0]}
                      </div>
                      <div className="flex-1 text-center md:text-left relative z-10">
                        <h3 className="text-xl font-black text-gray-900 mb-2">{form.name}</h3>
                        <p className="text-gray-500 text-sm font-medium line-clamp-2 max-w-md mx-auto md:mx-0">
                          {form.description || "Standard engagement gateway for professional service delivery and project initiation."}
                        </p>
                      </div>
                      <Link to={`/forms/${form._id}`} className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg relative z-10">
                        Initiate Booking
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trust Section: Partners & Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <section className="space-y-6">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Global Partners</h3>
                <div className="flex flex-wrap gap-4">
                  {Array.isArray(organization.partners) && organization.partners.length > 0 ? (
                    organization.partners.map((p, idx) => (
                      <div key={idx} className="h-16 w-32 bg-white rounded-2xl border border-gray-100 flex items-center justify-center p-3 grayscale hover:grayscale-0 transition-all" title={p.name}>
                        {p.logo ? <img src={getImageUrl(p.logo)} alt={p.name} className="h-full w-full object-contain" /> : <span className="text-xs font-bold text-gray-400">{p.name || "Partner"}</span>}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm font-bold">Partnerships available upon inquiry</div>
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Latest Insight</h3>
                {Array.isArray(organization.updates) && organization.updates.length > 0 ? (
                  <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-600 text-white text-[10px] uppercase font-black rounded-bl-2xl">New Announcement</div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2 pr-12 line-clamp-1">{organization.updates[organization.updates.length - 1].title}</h4>
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4">{organization.updates[organization.updates.length - 1].content}</p>
                    <button className="text-xs font-bold text-emerald-600 hover:tracking-widest transition-all uppercase">Explore Updates →</button>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-[2rem] p-6 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100">
                    Stay tuned for official updates
                  </div>
                )}
              </section>
            </div>

            {/* Media Highlight */}
            {Array.isArray(organization.media) && organization.media.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ecosystem Highlights</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {organization.media.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="aspect-square rounded-3xl overflow-hidden shadow-sm relative group">
                      {item.type === 'image' ? (
                        <img src={getImageUrl(item.url)} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="h-full w-full bg-gray-900 flex items-center justify-center text-white">Video Path</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-xs font-black uppercase truncate">{item.title || "Gallery Item"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
