import React, { useState, useEffect, useRef } from "react";
import { checkInTicket } from "../../api/ticketService";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, XCircle, CheckCircle2, Loader2, QrCode } from "lucide-react";

const CheckInScanner = () => {
    const [ticketId, setTicketId] = useState("");
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '', data: null }
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const scannerRef = useRef(null);
    const qrRegionId = "qr-reader";

    const handleCheckIn = async (code) => {
        const idToUse = code || ticketId;
        if (!idToUse) return;

        setLoading(true);
        setStatus(null);

        try {
            const result = await checkInTicket(idToUse);
            setStatus({
                type: "success",
                message: "Check-in Successful!",
                data: result.ticket,
            });
            setTicketId(""); // Clear input for next scan

            // If scanning, stop it briefly to show success or keep it going
            // The user might want to scan multiple tickets
        } catch (error) {
            setStatus({
                type: "error",
                message: error.response?.data?.message || "Check-in Failed",
            });
        } finally {
            setLoading(false);
        }
    };

    const startScanner = async () => {
        setIsScanning(true);
        setStatus(null);

        // Give the DOM a moment to render the reader div
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode(qrRegionId);
                scannerRef.current = html5QrCode;

                const config = { fps: 10, qrbox: { width: 250, height: 250 } };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // On Success
                        console.log("QR Decoded:", decodedText);
                        setTicketId(decodedText);
                        stopScanner();
                        handleCheckIn(decodedText);
                    },
                    () => {
                        // ignore failures
                    }
                );
            } catch (err) {
                console.error("Scanner error:", err);
                setIsScanning(false);
            }
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
                scannerRef.current.clear();
                setIsScanning(false);
            }).catch(err => console.error("Stop failed", err));
        } else {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop();
            }
        };
    }, []);

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
                    <QrCode className="text-indigo-600" size={32} />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Access Control</h1>
                <p className="text-sm text-gray-500 font-medium">Scan QR codes to verify attendees</p>
            </div>

            {/* Scanner Area */}
            <div className="mb-8 overflow-hidden rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 min-h-[300px] flex flex-col items-center justify-center relative bg-black/5">
                {isScanning ? (
                    <div id={qrRegionId} className="w-full h-full" />
                ) : (
                    <div className="text-center p-8">
                        <Camera className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-400 text-sm font-medium">Camera is inactive</p>
                    </div>
                )}

                {isScanning && (
                    <button
                        onClick={stopScanner}
                        className="absolute bottom-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-gray-700 hover:text-red-500 transition-colors"
                    >
                        <CameraOff size={20} />
                    </button>
                )}
            </div>

            {!isScanning && (
                <button
                    onClick={startScanner}
                    className="w-full mb-6 py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-[0.98] transition-all"
                >
                    <Camera size={20} />
                    Launch Scanner
                </button>
            )}

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest"><span className="bg-white px-2 text-gray-400">or manual input</span></div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(); }} className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value)}
                        placeholder="Enter Ticket ID manually"
                        className="w-full p-4 pl-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white text-base font-mono font-bold transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !ticketId}
                    className="w-full py-4 px-6 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify Ticket"}
                </button>
            </form>

            {status && (
                <div className={`mt-8 p-5 rounded-2xl border ${status.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                    : 'bg-rose-50 border-rose-100 text-rose-900'
                    } animate-in fade-in slide-in-from-top-4 duration-300`}>
                    <div className="flex items-center gap-3 mb-3">
                        {status.type === 'success' ? (
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                        ) : (
                            <XCircle className="text-rose-500 shrink-0" size={24} />
                        )}
                        <h2 className="text-lg font-bold tracking-tight">
                            {status.message}
                        </h2>
                    </div>

                    {status.data && (
                        <div className="space-y-2 bg-white/50 p-4 rounded-xl">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-widest">Attendee</span>
                                <span className="font-bold text-gray-900">{status.data.holderName}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-widest">Ticket ID</span>
                                <span className="font-mono font-bold text-indigo-600">{status.data.uniqueTicketId}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-widest">Status</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${status.data.status === 'checked-in' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {status.data.status}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CheckInScanner;

