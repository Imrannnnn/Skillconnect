import { useContext, useEffect, useState } from "react";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";

export default function ClientBookings() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?._id) return;
      setLoading(true);
      try {
        const { data } = await API.get(`/bookings?clientId=${user._id}`);
        const list = Array.isArray(data?.bookings) ? data.bookings : [];
        if (mounted) setItems(list);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false };
  }, [user?._id]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">My Bookings</h2>
      {loading && <p className="text-sm text-gray-500 mt-2">Loading…</p>}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <FilterButton label="All" active={statusFilter==='all'} onClick={()=>setStatusFilter('all')} />
        <FilterButton label="Pending" active={statusFilter==='pending'} onClick={()=>setStatusFilter('pending')} />
        <FilterButton label="Successful" active={statusFilter==='successful'} onClick={()=>setStatusFilter('successful')} />
        <FilterButton label="Declined" active={statusFilter==='declined'} onClick={()=>setStatusFilter('declined')} />
      </div>
      {!loading && items.length === 0 && <p className="text-sm text-gray-500 mt-2">No bookings yet.</p>}
      <div className="mt-4 space-y-2">
        {items.filter(b => statusFilter==='all' ? true : b.status===statusFilter).map((b) => (
          <div key={b._id} className="rounded-lg border border-gray-200 bg-white p-4 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-800">{b.description}</div>
              {b.address && <div className="text-xs text-gray-500 mt-1">{b.address}</div>}
              {b.details && <div className="text-xs text-gray-500 mt-1">{b.details}</div>}
              <div className="text-xs text-gray-500 mt-1">{new Date(b.createdAt).toLocaleString()}</div>
            </div>
            <StatusPill status={b.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    declined: 'bg-rose-50 text-rose-700 border-rose-200',
    successful: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const cls = map[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  return <span className={`px-2 py-0.5 text-[10px] rounded-md border ${cls}`}>{status}</span>;
}

function FilterButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-2 py-1 rounded-md border text-xs ${active ? 'border-emerald-600 text-emerald-700 bg-emerald-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
      {label}
    </button>
  );
}
