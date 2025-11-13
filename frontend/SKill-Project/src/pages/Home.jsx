import { Link } from "react-router-dom";

export default function Home() {
  const categories = ["Plumber", "Driver", "Cooker", "Fashion designer", "Cleaner"];
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold mb-2">Find trusted service providers</h1>
        <p className="text-gray-500">Chat, hire, and pay securely — all in one place.</p>
        <div className="mt-6 flex justify-center">
          <Link to="/providers" className="px-5 py-2.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-all">
            Browse Providers
          </Link>
        </div>
      </div>

      {/* How It Works (compact) */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          { title: 'Search', desc: 'Filter by category, type, and location.' },
          { title: 'Chat', desc: 'Discuss scope and timelines in real time.' },
          { title: 'Hire', desc: 'Book confidently with transparent profiles.' },
          { title: 'Pay', desc: 'Secure payments with clear milestones.' },
        ].map((s, i) => (
          <div key={s.title} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">{i+1}</div>
            <h3 className="mt-2 font-semibold text-gray-900">{s.title}</h3>
            <p className="text-sm text-gray-600">{s.desc}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((c) => (
          <Link
            key={c}
            to={`/providers?category=${encodeURIComponent(c)}`}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-lg transition-all text-center"
          >
            <span className="text-gray-800 font-medium">{c}</span>
          </Link>
        ))}
      </div>

      {/* Why SkillConnect (compact) */}
      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[ 
          { title: 'Trusted', desc: 'Clear profiles and reviews build confidence.' },
          { title: 'Fast', desc: 'Match quickly and keep momentum with chat.' },
          { title: 'Flexible', desc: 'Work locally or remotely—your choice.' },
        ].map((v) => (
          <div key={v.title} className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="font-semibold text-gray-900">{v.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{v.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
