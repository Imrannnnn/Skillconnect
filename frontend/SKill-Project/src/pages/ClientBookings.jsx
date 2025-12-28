import { useContext, useEffect, useState } from "react";
import API from "../api/axios.js";
import { AuthContext } from "../context/auth.js";
import { useToast } from "../components/toast.js";

export default function ClientBookings() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const { notify } = useToast();

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

  async function updateFlow(id, action) {
    try {
      setUpdatingId(id);
      const { data } = await API.put(`/bookings/${id}/timeline`, { action });
      if (data?.booking) {
        setItems((prev) => prev.map((b) => (b._id === id ? data.booking : b)));
      }
      notify("Status updated", { type: "success" });
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to update status", { type: "error" });
    } finally {
      setUpdatingId(null);
    }
  }

  async function releasePayment(id) {
    try {
      setUpdatingId(id);
      const { data } = await API.put(`/bookings/${id}/timeline`, { action: "release_payment" });
      if (data?.booking) {
        setItems((prev) => prev.map((b) => (b._id === id ? data.booking : b)));
      }
      notify("Payment released to provider", { type: "success" });
    } catch (e) {
      notify(e?.response?.data?.message || "Failed to release payment", { type: "error" });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold">My Orders & Bookings</h2>
      {loading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="loader" />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Status:</span>
          <FilterButton label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          <FilterButton label="Pending" active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
          <FilterButton label="Successful" active={statusFilter === 'successful'} onClick={() => setStatusFilter('successful')} />
          <FilterButton label="Declined" active={statusFilter === 'declined'} onClick={() => setStatusFilter('declined')} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Type:</span>
          <FilterButton label="All" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
          <FilterButton label="Service" active={typeFilter === 'service'} onClick={() => setTypeFilter('service')} />
          <FilterButton label="Product" active={typeFilter === 'product'} onClick={() => setTypeFilter('product')} />
        </div>
      </div>
      {!loading && items.length === 0 && <p className="text-sm text-gray-500 mt-2">No orders or bookings yet.</p>}
      <div className="mt-4 space-y-2">
        {items
          .filter((b) => statusFilter === 'all' ? true : b.status === statusFilter)
          .filter((b) => {
            if (typeFilter === 'all') return true;
            const t = b.bookingType || 'service';
            return typeFilter === t;
          })
          .map((b) => (
            <div key={b._id} className="rounded-lg border border-gray-200 bg-white p-4 flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-800 flex items-center gap-2">
                  <span className="truncate">{b.description}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${b.bookingType === 'product' ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    {b.bookingType === 'product' ? 'Product' : 'Service'}
                  </span>
                </div>
                {b.productSnapshot?.name && (
                  <div className="text-xs text-gray-600 mt-1">
                    Product: {b.productSnapshot.name}
                    {b.productSnapshot.productCode && (
                      <span className="ml-1 text-[10px] text-gray-500">(ID: {b.productSnapshot.productCode})</span>
                    )}
                    {b.quantity && (
                      <span className="ml-2 font-medium text-emerald-700">Qty: {b.quantity}</span>
                    )}
                  </div>
                )}
                {b.address && <div className="text-xs text-gray-500 mt-1">{b.address}</div>}
                {b.details && <div className="text-xs text-gray-500 mt-1">{b.details}</div>}
                <div className="text-xs text-gray-500 mt-1">{new Date(b.createdAt).toLocaleString()}</div>
                {b.flowStatus && (
                  <div className="mt-1 text-[11px] text-gray-500">
                    Flow: <span className="font-semibold text-gray-700">{b.flowStatus}</span>
                  </div>
                )}
                {Array.isArray(b.statusHistory) && b.statusHistory.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-gray-500">
                    {b.statusHistory.slice(-3).map((h, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-gray-400" />
                        <span className="truncate">
                          {h.status} · {h.at ? new Date(h.at).toLocaleString() : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {b.flowStatus === 'job_completed' && (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={updatingId === b._id}
                      onClick={() => releasePayment(b._id)}
                      className="px-3 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70"
                    >
                      Release payment
                    </button>
                  </div>
                )}
                {b.flowStatus === 'delivered' && (
                  <div className="mt-2">
                    <button
                      type="button"
                      disabled={updatingId === b._id}
                      onClick={() => updateFlow(b._id, 'confirm_receipt')}
                      className="px-3 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70"
                    >
                      Confirm Receipt
                    </button>
                  </div>
                )}
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
