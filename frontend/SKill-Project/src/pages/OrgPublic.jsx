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
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-500">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-24 top-[-6rem] h-64 w-64 rounded-full bg-emerald-300 blur-3xl" />
          <div className="absolute bottom-[-8rem] right-[-4rem] h-72 w-72 rounded-full bg-teal-300 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-emerald-900" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-20 text-white">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {organization.logo ? (
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10 p-3 shadow-lg shadow-emerald-900/30 backdrop-blur">
                <img
                  src={getImageUrl(organization.logo)}
                  alt={`${organization.name} logo`}
                  className="h-full w-full rounded-2xl object-contain"
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-4xl font-semibold uppercase tracking-wider text-white/80 shadow-lg shadow-emerald-900/30 backdrop-blur">
                {organization.name?.slice(0, 2) || "SC"}
              </div>
            )}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Organization profile</p>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                {organization.name}
              </h1>
              {organization.tagline && (
                <p className="max-w-2xl text-base text-white/80 sm:text-lg">
                  {organization.tagline}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                {organization.sector && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 font-medium">
                    {organization.sector}
                  </span>
                )}
                {hasRating && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-medium">
                    <span className="text-amber-300">★</span>
                    {ratingScore.toFixed(1)}
                    {ratingCount && ratingCount > 0 && (
                      <span className="text-white/60">({ratingCount})</span>
                    )}
                  </span>
                )}
                {createdAtDisplay && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium text-white/70">
                    <span className="text-white/50">Since</span>
                    {createdAtDisplay}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
            {bookingForms.length > 0 && (
              <a
                href="#booking-options"
                className="inline-flex items-center rounded-full bg-white px-4 py-2 font-semibold text-emerald-700 shadow hover:bg-white/90"
              >
                <span aria-hidden="true" className="mr-2">🗓</span>
                Book a service
              </a>
            )}
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Visit website
              </a>
            )}
            {organization.email && (
              <a
                href={`mailto:${organization.email}`}
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Contact via email
              </a>
            )}
            {organization.phone && (
              <a
                href={`tel:${organization.phone}`}
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Call {organization.phone}
              </a>
            )}
            {hasExtendedDetails && (
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <span className="mr-2 text-base" aria-hidden="true">{showDetails ? "−" : "+"}</span>
                {showDetails ? "Hide full profile" : "View full profile"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-12 max-w-5xl px-4">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-emerald-900/5 ring-1 ring-black/5">
          <div className="space-y-12 p-6 sm:p-10">
            <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">About {organization.name}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-700 whitespace-pre-line">
                  {organization.description || "This organization has not added a description yet."}
                </p>
              </div>
              {hasContactInfo && (
                <div className="rounded-2xl bg-emerald-50/60 p-5 text-sm text-emerald-900 shadow-inner">
                  <h3 className="text-sm font-semibold text-emerald-900">Connect with {organization.name}</h3>
                  <ul className="mt-3 space-y-2">
                    {organization.address && (
                      <li className="flex gap-2">
                        <span className="mt-0.5 text-emerald-500" aria-hidden="true">📍</span>
                        <span className="whitespace-pre-line">{organization.address}</span>
                      </li>
                    )}
                    {organization.email && (
                      <li className="flex gap-2 break-all">
                        <span className="mt-0.5 text-emerald-500" aria-hidden="true">✉️</span>
                        <a href={`mailto:${organization.email}`} className="hover:text-emerald-700">{organization.email}</a>
                      </li>
                    )}
                    {organization.phone && (
                      <li className="flex gap-2">
                        <span className="mt-0.5 text-emerald-500" aria-hidden="true">📞</span>
                        <a href={`tel:${organization.phone}`} className="hover:text-emerald-700">{organization.phone}</a>
                      </li>
                    )}
                    {organization.website && (
                      <li className="flex gap-2 break-all">
                        <span className="mt-0.5 text-emerald-500" aria-hidden="true">🌐</span>
                        <a href={organization.website} target="_blank" rel="noreferrer" className="hover:text-emerald-700">
                          {organization.website}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </section>

            {bookingForms.length > 0 && (
              <section id="booking-options" className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Booking options</h2>
                  <p className="text-xs uppercase tracking-wide text-emerald-600">Powered by SkillConnect</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {bookingForms.map((form) => (
                    <div
                      key={form._id}
                      className="group flex h-full flex-col justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white"
                    >
                      <div>
                        <h3 className="text-base font-semibold text-emerald-900">{form.name}</h3>
                        {form.description && (
                          <p className="mt-2 text-sm text-emerald-800/80 line-clamp-4">{form.description}</p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-emerald-700">
                        <span>{form.allowAnonymous ? "No login required" : "Login required"}</span>
                        <Link
                          to={`/forms/${form._id}`}
                          className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          Start booking
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {showDetails && (
              <div className="space-y-12 border-t border-gray-100 pt-10">
                {Array.isArray(organization.services) && organization.services.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl">🛠</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Services</h3>
                        <p className="text-sm text-gray-500">What {organization.name} offers.</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {organization.services.map((svc, index) => {
                        const title = typeof svc === "string" ? svc : svc?.title;
                        const description = typeof svc === "object" ? svc?.description : "";
                        return (
                          <div
                            key={index}
                            className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 text-sm text-gray-700 shadow-sm"
                          >
                            <div className="text-base font-semibold text-gray-900">{title || `Service ${index + 1}`}</div>
                            {description && <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {Array.isArray(organization.projects) && organization.projects.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl">📁</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Projects & portfolio</h3>
                        <p className="text-sm text-gray-500">Recent work and highlights.</p>
                      </div>
                    </div>
                    <ul className="mt-6 space-y-2 rounded-2xl border border-gray-100 bg-white p-5 text-sm leading-6 text-gray-700">
                      {organization.projects.map((project, index) => (
                        <li key={index} className="relative pl-4">
                          <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-emerald-500" />
                          {project}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {reviews.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-xl">★</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">What people say</h3>
                        <p className="text-sm text-gray-500">Feedback from clients & partners.</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {reviewPagination.pageReviews.map((review, index) => {
                        const rating = typeof review.rating === "number" ? review.rating : null;
                        return (
                          <div
                            key={index}
                            className="flex h-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-700 shadow-sm"
                          >
                            {rating && rating > 0 && (
                              <div className="text-sm text-amber-500">
                                {"★".repeat(Math.max(1, Math.min(5, Math.round(rating))))}
                              </div>
                            )}
                            {review.comment && (
                              <p className="text-sm leading-6 text-gray-600 whitespace-pre-line">{review.comment}</p>
                            )}
                            <div className="text-xs text-gray-500">
                              {review.author && <span className="font-semibold text-gray-800">{review.author}</span>}
                              {review.roleOrOrg && (
                                <span className="ml-1">• {review.roleOrOrg}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {reviewPagination.totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                        <button
                          type="button"
                          onClick={() => setReviewPage((prev) => Math.max(0, prev - 1))}
                          disabled={reviewPagination.safePage === 0}
                          className="rounded-full border border-gray-200 px-3 py-1 font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span>
                          Page {reviewPagination.safePage + 1} of {reviewPagination.totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReviewPage((prev) => Math.min(reviewPagination.totalPages - 1, prev + 1))}
                          disabled={reviewPagination.safePage >= reviewPagination.totalPages - 1}
                          className="rounded-full border border-gray-200 px-3 py-1 font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {Array.isArray(organization.partners) && organization.partners.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-xl">🤝</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Partners</h3>
                        <p className="text-sm text-gray-500">Organizations we collaborate with.</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {organization.partners.map((partner, index) => (
                        <div
                          key={index}
                          className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-700 shadow-sm"
                        >
                          {partner.logo && (
                            <img
                              src={getImageUrl(partner.logo)}
                              alt={partner.name || "Partner"}
                              className="h-16 w-16 flex-shrink-0 rounded-xl object-contain border border-gray-100"
                            />
                          )}
                          <div className="min-w-0">
                            {partner.name && <div className="text-base font-semibold text-gray-900">{partner.name}</div>}
                            {partner.website && (
                              <a
                                href={partner.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-emerald-600 hover:text-emerald-700 break-all"
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
                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-xl">📷</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Media gallery</h3>
                        <p className="text-sm text-gray-500">A glimpse into our world.</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      {organization.media.map((item, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                        >
                          {item.type === "image" && item.url && (
                            <img
                              src={getImageUrl(item.url)}
                              alt={item.title || "Media"}
                              className="h-48 w-full object-cover"
                            />
                          )}
                          {item.type === "video" && item.url && (
                            <div className="aspect-video w-full overflow-hidden bg-black">
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
                            <p className="px-5 pb-5 text-sm font-medium text-gray-700">{item.title}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {Array.isArray(organization.certificates) && organization.certificates.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl">🎓</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Certifications & accreditations</h3>
                        <p className="text-sm text-gray-500">Proof of expertise and trust.</p>
                      </div>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {organization.certificates.map((cert, index) => (
                        <li
                          key={index}
                          className="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-700 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="text-base font-semibold text-gray-900">{cert.name}</div>
                            <div className="text-xs text-gray-500">
                              {cert.issuer && <span>{cert.issuer}</span>}
                              {cert.issuer && cert.year && <span className="mx-1">•</span>}
                              {cert.year && <span>{cert.year}</span>}
                            </div>
                          </div>
                          {cert.link && (
                            <a
                              href={cert.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
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
                    <section>
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-xl">⏱</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Latest updates</h3>
                          <p className="text-sm text-gray-500">News and announcements.</p>
                        </div>
                      </div>
                      <div className="mt-6 space-y-4">
                        {visibleUpdates.map((item, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-700 shadow-sm"
                          >
                            {item.title && <div className="text-base font-semibold text-gray-900">{item.title}</div>}
                            {item.date && <div className="text-xs text-gray-500">{item.date}</div>}
                            {item.content && (
                              <p className="mt-2 text-sm leading-6 text-gray-600 whitespace-pre-line">{item.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })()}

                {Array.isArray(organization.teamMembers) && organization.teamMembers.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl">👥</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Team members</h3>
                        <p className="text-sm text-gray-500">Meet the people behind the work.</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {organization.teamMembers.map((member, index) => (
                        <div
                          key={index}
                          className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-700 shadow-sm"
                        >
                          {member.photoUrl && (
                            <img
                              src={getImageUrl(member.photoUrl)}
                              alt={member.name || "Team member"}
                              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            {member.name && <div className="text-base font-semibold text-gray-900">{member.name}</div>}
                            {member.role && <div className="text-xs text-gray-500">{member.role}</div>}
                            {member.bio && (
                              <p className="mt-2 text-sm leading-6 text-gray-600 whitespace-pre-line">{member.bio}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {Array.isArray(organization.achievements) && organization.achievements.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl">🏆</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Achievements & milestones</h3>
                        <p className="text-sm text-gray-500">Celebrating key moments.</p>
                      </div>
                    </div>
                    <ul className="mt-6 space-y-2 rounded-2xl border border-gray-100 bg-white p-5 text-sm leading-6 text-gray-700">
                      {organization.achievements.map((achievement, index) => (
                        <li key={index} className="relative pl-4">
                          <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-emerald-500" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
