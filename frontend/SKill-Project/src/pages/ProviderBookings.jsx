import { useContext, useEffect, useState } from "react";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";
import { useToast } from "../components/toast.js";
import { NetBus } from "../api/axios.js";

export default function ProviderBookings() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const { notify } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?._id) return;
      setLoading(true);
      try {
        const { data } = await API.get(`/bookings?providerId=${user._id}`);
        const list = Array.isArray(data?.bookings) ? data.bookings : [];
        if (mounted) setItems(list);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false };
  }, [user?._id]);

  async function setStatus(id, status) {
    try {
      setUpdatingId(id);
      const { data } = await API.put(`/bookings/${id}/status`, { status });
      setItems((prev) => prev.map((b) => (b._id === id ? data.booking : b)));
      notify(`Booking marked as ${status}`, { type: status === 'successful' ? 'success' : status === 'declined' ? 'error' : 'info' });
      NetBus.emit({ bookingsUpdated: true, at: Date.now() });
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to update booking', { type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-semibold">Bookings</h2>
        <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
          Pending: {items.filter((b)=>b.status==='pending').length}
        </span>
      </div>
      {loading && <p className="text-sm text-gray-500 mt-2">Loading…</p>}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          <FilterButton label="All" active={statusFilter==='all'} onClick={()=>setStatusFilter('all')} />
          <FilterButton label="Pending" active={statusFilter==='pending'} onClick={()=>setStatusFilter('pending')} />
          <FilterButton label="Successful" active={statusFilter==='successful'} onClick={()=>setStatusFilter('successful')} />
          <FilterButton label="Declined" active={statusFilter==='declined'} onClick={()=>setStatusFilter('declined')} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Type:</span>
          <FilterButton label="All" active={typeFilter==='all'} onClick={()=>setTypeFilter('all')} />
          <FilterButton label="Service" active={typeFilter==='service'} onClick={()=>setTypeFilter('service')} />
          <FilterButton label="Product" active={typeFilter==='product'} onClick={()=>setTypeFilter('product')} />
        </div>
      </div>
      {!loading && items.length === 0 && <p className="text-sm text-gray-500 mt-2">No bookings yet.</p>}
      <div className="mt-4 space-y-2">
        {items
          .filter((b) => statusFilter==='all' ? true : b.status===statusFilter)
          .filter((b) => {
            if (typeFilter === 'all') return true;
            const t = b.bookingType || 'service';
            return typeFilter === t;
          })
          .map((b) => (
          <div key={b._id} className="rounded-lg border border-gray-200 bg-white p-4 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-800 flex flex-wrap items-center gap-2">
                <span>{b.clientName}</span>
                <span className="text-xs text-gray-500">({b.clientPhone})</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${b.bookingType === 'product' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                  {b.bookingType === 'product' ? 'Product' : 'Service'}
                </span>
              </div>
              <div className="text-sm text-gray-700 mt-1 break-words">{b.description}</div>
              {b.productSnapshot?.name && (
                <div className="text-xs text-gray-600 mt-1">
                  Product: {b.productSnapshot.name}
                  {b.productSnapshot.productCode && (
                    <span className="ml-1 text-[10px] text-gray-500">(ID: {b.productSnapshot.productCode})</span>
                  )}
                </div>
              )}
              {b.address && <div className="text-xs text-gray-500 mt-1">{b.address}</div>}
              {b.details && <div className="text-xs text-gray-500 mt-1">{b.details}</div>}
              <div className="text-xs text-gray-500 mt-1">{new Date(b.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={b.status} />
              <div className="hidden sm:flex items-center gap-2">
                <button disabled={updatingId===b._id} onClick={()=>setStatus(b._id,'successful')} className="px-2 py-1 text-xs rounded-md border border-emerald-600 text-emerald-700 hover:bg-emerald-50 disabled:opacity-70">Accept</button>
                <button disabled={updatingId===b._id} onClick={()=>setStatus(b._id,'declined')} className="px-2 py-1 text-xs rounded-md border border-rose-600 text-rose-700 hover:bg-rose-50 disabled:opacity-70">Decline</button>
                <button disabled={updatingId===b._id} onClick={()=>setStatus(b._id,'pending')} className="px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-70">Pending</button>
                <button type="button" onClick={()=>copyBooking(b)} className="px-2 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50">Copy</button>
              </div>
            </div>
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

function copyBooking(b) {
  const lines = [
    `Client: ${b.clientName} (${b.clientPhone})`,
    `Status: ${b.status}`,
    `Description: ${b.description}`,
    b.address ? `Address: ${b.address}` : '',
    b.details ? `Details: ${b.details}` : '',
    `Created: ${new Date(b.createdAt).toLocaleString()}`,
  ].filter(Boolean).join('\n');
  try {
    navigator.clipboard.writeText(lines);
    // best-effort toast via document event if toast not available here
  } catch { void 0 }
}
