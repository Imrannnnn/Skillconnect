import React, { useState } from "react";
import { checkInTicket } from "../../api/ticketService";

const CheckInScanner = () => {
    const [ticketId, setTicketId] = useState("");
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '', data: null }
    const [loading, setLoading] = useState(false);

    const handleCheckIn = async (e) => {
        e.preventDefault();
        if (!ticketId) return;

        setLoading(true);
        setStatus(null);

        try {
            const result = await checkInTicket(ticketId);
            setStatus({
                type: "success",
                message: "Check-in Successful!",
                data: result.ticket,
            });
            setTicketId(""); // Clear input for next scan
        } catch (error) {
            setStatus({
                type: "error",
                message: error.response?.data?.message || "Check-in Failed",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
            <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Ticket Check-in</h1>

            <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticket ID / QR Data</label>
                    <input
                        type="text"
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                        placeholder="Scan or enter Ticket ID"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                        autoFocus
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !ticketId}
                    className={`w-full py-3 px-4 rounded-lg text-white font-bold text-lg transition-colors ${loading || !ticketId ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                >
                    {loading ? "Checking..." : "Check In"}
                </button>
            </form>

            {status && (
                <div className={`mt-6 p-4 rounded-lg text-center ${status.type === 'success' ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'
                    }`}>
                    <h2 className={`text-xl font-bold ${status.type === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                        {status.message}
                    </h2>

                    {status.data && (
                        <div className="mt-2 text-left text-sm text-gray-700">
                            <p><strong>Holder:</strong> {status.data.holderName}</p>
                            <p><strong>Ticket ID:</strong> {status.data.uniqueTicketId}</p>
                            <p><strong>Status:</strong> {status.data.status}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 text-center text-gray-500 text-sm">
                <p>Use a barcode scanner acting as keyboard input,</p>
                <p>or manually type the Ticket ID.</p>
            </div>
        </div>
    );
};

export default CheckInScanner;
