import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios.js";

export default function OrgPublic() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewPage, setReviewPage] = useState(0);

  const bookingForms = useMemo(() => {
    return Array.isArray(organization?.bookingForms) ? organization.bookingForms : [];
  }, [organization?.bookingForms]);

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
    <div className="max-w-4xl mx-auto px-4 py-10">
      {organization.logo && (
        <div className="mb-4">
          <img
            src={organization.logo}
            alt={`${organization.name} logo`}
            className="h-20 w-20 rounded-md object-contain border border-gray-200 bg-white"
          />
        </div>
      )}
      <h1 className="text-2xl font-semibold text-gray-900">{organization.name}</h1>
      {organization.tagline && (
        <p className="mt-1 text-sm text-gray-700">
          {organization.tagline}
        </p>
      )}
      {organization.sector && (
        <p className="mt-1 text-xs uppercase tracking-wide text-emerald-700">
          {organization.sector}
        </p>
      )}
      {typeof organization.ratingScore === "number" && organization.ratingScore > 0 && (
        <p className="mt-1 text-xs text-amber-600">
          <span className="mr-1">★</span>
          {organization.ratingScore.toFixed(1)} / 5
          {typeof organization.ratingCount === "number" && organization.ratingCount > 0 && (
            <span className="ml-1 text-gray-600">
              ({organization.ratingCount} review{organization.ratingCount === 1 ? "" : "s"})
            </span>
          )}
        </p>
      )}
      {organization.createdAt && (
        <p className="mt-1 text-xs text-gray-500">
          On SkillConnect since {new Date(organization.createdAt).toLocaleDateString()}
        </p>
      )}
      {bookingForms.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-600 border border-emerald-100">
              🗓
            </span>
            <span>Book with {organization.name}</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {bookingForms.map((form) => (
              <div key={form._id} className="rounded-lg border border-emerald-200 bg-white p-4 flex flex-col justify-between gap-3 text-sm text-gray-700">
                <div className="min-h-[60px]">
                  <div className="text-base font-semibold text-gray-900">{form.name}</div>
                  {form.description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-3">{form.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{form.allowAnonymous ? "No login required" : "Login required"}</span>
                  <Link
                    to={`/forms/${form._id}`}
                    className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Book now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {organization.description && (
        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">
          {organization.description}
        </p>
      )}
      {(organization.email || organization.phone || organization.website) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {organization.email && (
            <a
              href={`mailto:${organization.email}`}
              className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Contact
            </a>
          )}
          {organization.phone && (
            <a
              href={`tel:${organization.phone}`}
              className="inline-flex items-center rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Call
            </a>
          )}
          {organization.website && (
            <a
              href={organization.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Visit website
            </a>
          )}
        </div>
      )}
      {(organization.address || organization.email || organization.phone || organization.website) && (
        <div className="mt-6 inline-flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          <div className="font-semibold text-gray-900">Organization details</div>
          {organization.address && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-wide text-gray-500">Address</span>
              <p className="text-sm text-gray-700 whitespace-pre-line">{organization.address}</p>
            </div>
          )}
          {organization.email && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-xs uppercase tracking-wide text-gray-500">Email:</span>
              <a
                href={`mailto:${organization.email}`}
                className="text-sm text-emerald-700 hover:text-emerald-800 break-all"
              >
                {organization.email}
              </a>
            </div>
          )}
          {organization.phone && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-xs uppercase tracking-wide text-gray-500">Phone:</span>
              <a
                href={`tel:${organization.phone}`}
                className="text-sm text-emerald-700 hover:text-emerald-800"
              >
                {organization.phone}
              </a>
            </div>
          )}
          {organization.website && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-xs uppercase tracking-wide text-gray-500">Website:</span>
              <a
                href={organization.website}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-emerald-700 hover:text-emerald-800 break-all"
              >
                {organization.website}
              </a>
            </div>
          )}
        </div>
      )}
      {Array.isArray(organization.services) && organization.services.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Services offered</h2>
          <ul className="space-y-1 text-sm text-gray-700">
            {organization.services.map((svc, index) => (
              <li key={index}>
                <span className="font-medium">{svc.title}</span>
                {svc.description && <span className="text-gray-600"> – {svc.description}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {Array.isArray(organization.projects) && organization.projects.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Projects / portfolio</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {organization.projects.map((p, index) => (
              <li key={index}>{p}</li>
            ))}
          </ul>
        </section>
      )}
      {Array.isArray(organization.reviews) && organization.reviews.length > 0 && (() => {
        const pageSize = 4;
        const totalReviews = organization.reviews.length;
        const totalPages = Math.ceil(totalReviews / pageSize);
        const safePage = Math.min(Math.max(reviewPage, 0), Math.max(totalPages - 1, 0));
        const start = safePage * pageSize;
        const pageReviews = organization.reviews.slice(start, start + pageSize);

        return (
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-[11px] font-bold text-amber-600 border border-amber-100">
                ★
              </span>
              <span>What people say</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {pageReviews.map((review, index) => {
                const rating = typeof review.rating === "number" ? review.rating : null;
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700"
                  >
                    {rating && rating > 0 && (
                      <div className="text-xs text-amber-600">
                        {"★".repeat(Math.max(1, Math.min(5, rating)))}
                      </div>
                    )}
                    {review.comment && (
                      <p className="text-xs text-gray-700 whitespace-pre-line">
                        {review.comment}
                      </p>
                    )}
                    <div className="mt-1 text-[11px] text-gray-500">
                      {review.author && <span className="font-medium text-gray-800">{review.author}</span>}
                      {review.roleOrOrg && (
                        <span className="ml-1">• {review.roleOrOrg}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between text-[11px] text-gray-600">
                <button
                  type="button"
                  onClick={() => setReviewPage((prev) => Math.max(0, prev - 1))}
                  disabled={safePage === 0}
                  className="px-2 py-1 rounded-md border border-gray-200 bg-white text-[11px] text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span>
                  Page {safePage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setReviewPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="px-2 py-1 rounded-md border border-gray-200 bg-white text-[11px] text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        );
      })()}
      {Array.isArray(organization.partners) && organization.partners.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600 border border-indigo-100">
              🤝
            </span>
            <span>Our partners</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {organization.partners.map((partner, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700"
              >
                {partner.logo && (
                  <img
                    src={partner.logo}
                    alt={partner.name || "Partner"}
                    className="h-10 w-10 flex-shrink-0 rounded-md object-contain border border-gray-200 bg-white"
                  />
                )}
                <div className="min-w-0">
                  {partner.name && (
                    <div className="font-semibold text-gray-900 truncate">{partner.name}</div>
                  )}
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-700 hover:text-emerald-800 break-all"
                    >
                      {partner.website}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {Array.isArray(organization.media) && organization.media.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-50 text-[11px] font-bold text-sky-600 border border-sky-100">
              📷
            </span>
            <span>Media gallery</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {organization.media.map((item, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700"
              >
                {item.type === "image" && item.url && (
                  <img
                    src={item.url}
                    alt={item.title || "Media"}
                    className="h-40 w-full rounded-md object-cover border border-gray-200"
                  />
                )}
                {item.type === "video" && item.url && (
                  <div className="aspect-video w-full overflow-hidden rounded-md border border-gray-200 bg-black">
                    <iframe
                      src={item.url}
                      title={item.title || "Video"}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                {item.title && (
                  <p className="text-xs text-gray-700 truncate">{item.title}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {Array.isArray(organization.certificates) && organization.certificates.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-600 border border-emerald-100">
              🎓
            </span>
            <span>Certifications & accreditations</span>
          </h2>
          <ul className="space-y-1 text-sm text-gray-700">
            {organization.certificates.map((cert, index) => (
              <li key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <span className="font-medium text-gray-900">{cert.name}</span>
                  {cert.issuer && (
                    <span className="ml-1 text-gray-600">• {cert.issuer}</span>
                  )}
                  {cert.year && (
                    <span className="ml-1 text-gray-500">({cert.year})</span>
                  )}
                </div>
                {cert.link && (
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-700 hover:text-emerald-800 break-all"
                  >
                    View certificate
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {Array.isArray(organization.updates) && organization.updates.length > 0 && (() => {
        const visibleUpdates = organization.updates.slice(-5).reverse();
        return (
          <section className="mt-8">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-[11px] font-bold text-amber-600 border border-amber-100">
                ⏱
              </span>
              <span>Latest updates</span>
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              {visibleUpdates.map((item, index) => (
                <div key={index} className="rounded-lg border border-gray-200 bg-white p-3">
                  {item.title && (
                    <div className="font-semibold text-gray-900">{item.title}</div>
                  )}
                  {item.date && (
                    <div className="text-[11px] text-gray-500 mt-0.5">{item.date}</div>
                  )}
                  {item.content && (
                    <p className="mt-1 text-xs text-gray-700 whitespace-pre-line">{item.content}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })()}
      {Array.isArray(organization.teamMembers) && organization.teamMembers.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Team members</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {organization.teamMembers.map((m, index) => (
              <div
                key={index}
                className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700"
              >
                {m.photoUrl && (
                  <img
                    src={m.photoUrl}
                    alt={m.name || 'Team member'}
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover border border-gray-200"
                  />
                )}
                <div className="min-w-0">
                  {m.name && <div className="font-semibold text-gray-900 truncate">{m.name}</div>}
                  {m.role && <div className="text-xs text-gray-500">{m.role}</div>}
                  {m.bio && <p className="mt-1 text-xs text-gray-700 whitespace-pre-line">{m.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {Array.isArray(organization.achievements) && organization.achievements.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Achievements & milestones</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {organization.achievements.map((a, index) => (
              <li key={index}>{a}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
