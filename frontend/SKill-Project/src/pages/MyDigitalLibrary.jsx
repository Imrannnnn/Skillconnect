import { useState, useEffect } from "react";
import API from "../api/axios";

export default function MyDigitalLibrary() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { data } = await API.get("/digital-products/buyer/my-library");
                setPurchases(data.purchases || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleDownload = async (purchaseId) => {
        // Open in new tab or trigger download
        // Since it's an authenticated endpoint, we can't just use <a href="..."> 
        // unless we use a cookie-based auth which we likely are?
        // If using Bearer token, we need to fetch fetching blob or using a temporary signed URL.
        // However, for simplicity given user requirements and typical JWT flows, 
        // often we use a direct link with ?token=... or we use fetchBlob.
        // But since `API` uses axios interceptors for Auth, let's use performDownload helper.

        try {
            const response = await API.get(`/digital-products/purchase/${purchaseId}/download`, {
                responseType: 'blob',
            });

            // Create URL
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Try to extract filename from header
            const contentDisposition = response.headers['content-disposition'];
            let filename = "download";
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            alert("Download failed. Your access might have expired.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Digital Library</h1>

            {loading ? (
                <div className="flex justify-center py-20"><div className="loader"></div></div>
            ) : purchases.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 text-lg">You haven't purchased any digital products yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {purchases.map(item => (
                        <div key={item._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.89 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{item.productId?.name || "Unknown Product"}</h3>
                                    <p className="text-xs text-gray-500">
                                        Purchased on {new Date(item.createdAt).toLocaleDateString()} • Sold by {item.sellerId?.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDownload(item._id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
