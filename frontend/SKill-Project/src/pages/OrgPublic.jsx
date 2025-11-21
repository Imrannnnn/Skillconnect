import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios.js";

export default function OrgPublic() {
  const { slug } = useParams();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <h1 className="text-2xl font-semibold text-gray-900">{organization.name}</h1>
      {organization.sector && (
        <p className="mt-1 text-sm uppercase tracking-wide text-emerald-700">
          {organization.sector}
        </p>
      )}
      {organization.createdAt && (
        <p className="mt-1 text-xs text-gray-500">
          On SkillConnect since {new Date(organization.createdAt).toLocaleDateString()}
        </p>
      )}
      {organization.description && (
        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">
          {organization.description}
        </p>
      )}
      <div className="mt-6 text-xs text-gray-500">
        <p>This is a public profile link for this organization on SkillConnect.</p>
      </div>
    </div>
  );
}
