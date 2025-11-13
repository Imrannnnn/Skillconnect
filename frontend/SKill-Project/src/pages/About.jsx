import { useEffect, useState } from 'react'
import API from '../api/axios.js'

export default function About() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        // Try a few common endpoints, stop at the first that returns an array
        const endpoints = ['/posts', '/blog', '/news']
        for (const ep of endpoints) {
          try {
            const { data } = await API.get(ep)
            const list = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : []
            if (Array.isArray(list) && list.length >= 0) {
              if (mounted) setPosts(list.slice(0, 6))
              break
            }
          } catch { /* try next */ }
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero with animated background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full animate-[float_12s_ease-in-out_infinite] opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, #10b981 2px, transparent 2px), radial-gradient(circle at 80% 40%, #0ea5e9 2px, transparent 2px), radial-gradient(circle at 40% 80%, #14b8a6 2px, transparent 2px)'
          }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-20 relative">
          <h1 className="text-3xl sm:text-5xl font-semibold text-gray-900">Welcome to SkillConnect</h1>
          <p className="mt-3 text-gray-600 text-lg max-w-2xl">Connecting skilled providers with clients globally — find talent, chat in real-time, and pay securely.</p>
          <div className="mt-6 flex gap-3">
            <a href="/providers" className="px-5 py-2.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Find Providers</a>
            <a href="/register" className="px-5 py-2.5 rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50">Get Started</a>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid gap-8 md:grid-cols-2 items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">About Us</h2>
          <p className="mt-3 text-gray-600 leading-relaxed">We are a marketplace designed to help clients discover, evaluate, and hire trusted service providers. Our platform brings chat, bookings, payments, and reviews together to streamline collaboration and delivery.</p>
          <ul className="mt-4 space-y-2 text-gray-600">
            <li className="flex items-start gap-2"><span className="text-emerald-600">✓</span><span>Verified providers with transparent profiles</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-600">✓</span><span>Secure payments with clear milestones</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-600">✓</span><span>Global reach with local proximity filters</span></li>
          </ul>
        </div>
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img src="https://images.unsplash.com/photo-1556761175-129418cb2dfe?q=80&w=1470&auto=format&fit=crop" alt="Team collaboration" className="w-full h-64 object-cover" />
        </div>
      </section>

      {/* How We Work */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-semibold text-gray-900">How We Work</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Research', desc: 'Understand your needs and scope your project.' },
              { title: 'Plan', desc: 'Match with providers and align on milestones.' },
              { title: 'Execute', desc: 'Collaborate in chat and track progress.' },
              { title: 'Deliver', desc: 'Approve and pay securely on completion.' },
            ].map((s, i) => (
              <div key={s.title} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">{i+1}</div>
                <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-semibold text-gray-900">Our Core Values</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Trust', desc: 'We value transparency and reliability.' },
              { title: 'Quality', desc: 'Delivering excellence in every engagement.' },
              { title: 'Speed', desc: 'Efficient matching and streamlined workflows.' },
              { title: 'Support', desc: 'We’re here to help from start to finish.' },
            ].map((v) => (
              <div key={v.title} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-gray-900">{v.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-semibold text-gray-900">What We Do</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Provider Discovery', desc: 'Search by category, location, and proximity.', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1470&auto=format&fit=crop' },
              { title: 'Real-time Chat', desc: 'Communicate and share files instantly.', img: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=1470&auto=format&fit=crop' },
              { title: 'Secure Payments', desc: 'Stripe-powered escrow with milestones.', img: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1470&auto=format&fit=crop' },
            ].map((c) => (
              <div key={c.title} className="rounded-lg overflow-hidden border border-gray-200 bg-white hover:shadow-md transition">
                <img src={c.img} alt="" className="w-full h-36 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog / News */}
      <section>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Latest News</h2>
            <a href="#" className="text-sm text-emerald-700 hover:text-emerald-800">View all</a>
          </div>
          {loading && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-full mt-2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4 mt-1" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(posts.length ? posts : [
              { _id: 'local-1', title: 'Welcome to SkillConnect', excerpt: 'A better way to find and hire providers.', createdAt: new Date().toISOString() },
              { _id: 'local-2', title: 'Proximity Search', excerpt: 'Find providers near you with radius filters.', createdAt: new Date().toISOString() },
              { _id: 'local-3', title: 'Secure Payments', excerpt: 'Escrow and milestone-based releases.', createdAt: new Date().toISOString() },
            ]).map((p) => (
              <article key={p._id || p.id} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition">
                <h3 className="font-semibold text-gray-900">{p.title || 'Untitled'}</h3>
                <p className="text-sm text-gray-600 mt-1">{p.excerpt || p.summary || 'Read more about this update.'}</p>
                <div className="mt-2 text-xs text-gray-500">{new Date(p.createdAt || p.date || Date.now()).toLocaleDateString()}</div>
                <a href="#" className="mt-2 inline-block text-sm text-emerald-700 hover:text-emerald-800">Read more</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-10 grid gap-6 sm:grid-cols-3">
          <div>
            <h3 className="text-white font-semibold">SkillConnect</h3>
            <p className="text-sm mt-2 text-gray-400">Connecting skilled providers and clients globally.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold">Contact</h4>
            <p className="text-sm mt-2">123 Market Street, Lagos NG</p>
            <p className="text-sm">hello@skillconnect.app</p>
          </div>
          <div>
            <h4 className="text-white font-semibold">Follow</h4>
            <div className="mt-2 flex gap-3 text-sm">
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">LinkedIn</a>
              <a href="#" className="hover:text-white">Instagram</a>
            </div>
          </div>
        </div>
        <div className="text-xs text-center text-gray-500 pb-6">© {new Date().getFullYear()} SkillConnect. All rights reserved.</div>
      </footer>
    </div>
  )
}
