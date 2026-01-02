import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios.js'

export default function About() {
  const [stats, setStats] = useState([
    { label: 'Active Users', value: '10K+' },
    { label: 'Verified Providers', value: '500+' },
    { label: 'Digital Products', value: '1.2K+' },
    { label: 'Events Hosted', value: '300+' },
  ])

  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Hero Section */}
      <section className="relative bg-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
            alt="Collaboration"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-emerald-900/90 to-transparent"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col justify-center min-h-[60vh]">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Empowering the <br />
            <span className="text-emerald-400">Future of Work</span>
          </h1>
          <p className="text-xl md:text-2xl text-emerald-100 max-w-2xl mb-10 leading-relaxed">
            SkillConnect is the premier ecosystem for professionals, creators, and organizers to collaborate, sell, and grow. We bridge the gap between talent and opportunity.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/register" className="px-8 py-3.5 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition shadow-lg shadow-emerald-900/20">
              Join the Ecosystem
            </Link>
            <Link to="/providers" className="px-8 py-3.5 rounded-full border border-emerald-400 text-emerald-100 font-semibold hover:bg-emerald-800/50 transition">
              Explore Talent
            </Link>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-2">Our Mission</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Building Bridges for Global Talent</h3>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                In a rapidly evolving digital economy, finding reliable expertise or the right tools shouldn't be a hurdle.
                SkillConnect was born from a simple idea: to create a trusted, all-in-one platform where professionals can thrive.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Whether you are a freelancer offering services, a creator selling digital assets, or an event organizer bringing people together,
                SkillConnect provides the infrastructure you need to succeed—securely and seamlessly.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-900 text-xl">Trust First</h4>
                  <p className="text-sm text-gray-500 mt-1">Verified profiles and secure escrow payments.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xl">Community Led</h4>
                  <p className="text-sm text-gray-500 mt-1">Events, forums, and real connection.</p>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition duration-500">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop"
                alt="Team working"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                <p className="font-medium">Connecting over 50 countries</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Ecosystem (Cards) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">A Complete Ecosystem</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to grow your business and career in one place.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300">
              <div className="h-48 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop" alt="Services" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
              </div>
              <div className="p-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4 text-2xl">💼</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Service Marketplace</h3>
                <p className="text-gray-600">Hire top-tier developers, designers, and consultants. Our proximity search finds talent near you.</p>
                <Link to="/providers" className="inline-block mt-4 text-emerald-600 font-medium hover:text-emerald-700">Find Talent →</Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300">
              <div className="h-48 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1626785774573-4b799314346d?q=80&w=2070&auto=format&fit=crop" alt="Digital Products" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
              </div>
              <div className="p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 text-2xl">🛍️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Digital Products</h3>
                <p className="text-gray-600">Buy and sell templates, ebooks, courses, and software. Instant delivery and secure transactions.</p>
                <Link to="/digital-marketplace" className="inline-block mt-4 text-blue-600 font-medium hover:text-blue-700">Browse Shop →</Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300">
              <div className="h-48 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2070&auto=format&fit=crop" alt="Events" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
              </div>
              <div className="p-8">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4 text-2xl">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Events & Tickets</h3>
                <p className="text-gray-600">Discover workshops, webinars, and conferences. Organizers can manage ticketing and check-ins effortlessly.</p>
                <Link to="/events" className="inline-block mt-4 text-purple-600 font-medium hover:text-purple-700">Find Events →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-emerald-900 py-16 text-white border-t border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-emerald-800/50">
            {stats.map((stat, idx) => (
              <div key={idx} className="p-4">
                <div className="text-4xl font-bold text-emerald-400 mb-2">{stat.value}</div>
                <div className="text-emerald-200 uppercase tracking-widest text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-600 mb-10">Join thousands of professionals growing their business on SkillConnect today.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="px-10 py-4 rounded-full bg-emerald-600 text-white text-lg font-semibold hover:bg-emerald-700 shadow-xl shadow-emerald-200 hover:-translate-y-1 transition">Create Free Account</Link>
            <Link to="/about" className="px-10 py-4 rounded-full bg-gray-100 text-gray-800 text-lg font-semibold hover:bg-gray-200 transition">Contact Sales</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xl mb-4">SC</div>
            <p className="text-sm">SkillConnect is your gateway to the digital economy. Freelance, sell, learn, and grow.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/providers" className="hover:text-emerald-400">Find Talent</Link></li>
              <li><Link to="/digital-marketplace" className="hover:text-emerald-400">Digital Market</Link></li>
              <li><Link to="/events" className="hover:text-emerald-400">Events</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-emerald-400">About Us</Link></li>
              <li><Link to="/privacy" className="hover:text-emerald-400">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-400">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
              <a href="#" className="hover:text-white transition">Instagram</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-xs">
          © {new Date().getFullYear()} SkillConnect Inc. All rights reserved.
        </div>
      </footer>

    </div>
  )
}
