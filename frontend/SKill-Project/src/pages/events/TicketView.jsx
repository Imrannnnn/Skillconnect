import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTicket, downloadTicket } from "../../api/ticketService";
import { Calendar, Clock, MapPin, User, Ticket as TicketIcon, Download, ChevronLeft, QrCode } from "lucide-react";

const TicketView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticketData, setTicketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const data = await getTicket(id);
                setTicketData(data);
            } catch (error) {
                console.error("Error fetching ticket:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [id]);

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const blob = await downloadTicket(ticketData.ticket.uniqueTicketId);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ticket-${ticketData.ticket.uniqueTicketId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download ticket PDF. Please try again later.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!ticketData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Ticket Not Found</h2>
                    <p className="text-gray-600 mb-6">We couldn't find the ticket you're looking for.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const { ticket, ticketType } = ticketData;
    const event = ticket.eventId;

    return (
        <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:py-12 flex flex-col items-center">
            {/* Action Bar */}
            <div className="w-full max-w-[400px] flex justify-between items-center mb-6 px-1">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-emerald-700 font-medium transition-colors"
                >
                    <ChevronLeft size={20} className="mr-1" />
                    Back
                </button>
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:border-emerald-300 hover:text-emerald-700 transition-all disabled:opacity-50"
                >
                    {downloading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent mr-2" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Download size={16} className="mr-2" />
                            Download PDF
                        </>
                    )}
                </button>
            </div>

            {/* Ticket Card */}
            <div className="w-full max-w-[400px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden relative border border-gray-100">
                {/* Top Emerald Gradient Bar */}
                {/* Top Flyer/Banner Image */}
                {event.branding?.backgroundImageUrl ? (
                    <div className="w-full h-48 overflow-hidden relative">
                        <img
                            src={event.branding.backgroundImageUrl}
                            alt="Event Flyer"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                ) : (
                    <div className="h-3 bg-gradient-to-r from-emerald-400 to-emerald-600 w-full" />
                )}

                {/* Event Header */}
                <div className="p-8 pb-4 text-center">
                    <div className="inline-block p-3 bg-emerald-50 rounded-2xl mb-4">
                        <TicketIcon className="text-emerald-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2">
                        {event.title}
                    </h1>
                    <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {ticketType.name}
                    </div>
                </div>

                {/* Event Details */}
                <div className="px-8 space-y-4">
                    <div className="flex items-start">
                        <div className="p-2 bg-gray-50 rounded-lg mr-4">
                            <Calendar size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider uppercase">Date & Time</p>
                            <p className="text-sm font-semibold text-gray-800">
                                {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                                <span className="mx-2 text-gray-300">|</span>
                                {event.time}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="p-2 bg-gray-50 rounded-lg mr-4">
                            <MapPin size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider uppercase">Location</p>
                            <p className="text-sm font-semibold text-gray-800">{event.venue}</p>
                            <p className="text-xs text-gray-500">{event.city}</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="p-2 bg-gray-50 rounded-lg mr-4">
                            <User size={18} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider uppercase">Ticket Holder</p>
                            <p className="text-sm font-semibold text-gray-800">{ticket.holderName}</p>
                        </div>
                    </div>
                </div>

                {/* Divider with side notches */}
                <div className="relative my-8">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#f8fafc] rounded-r-full border-r border-gray-100" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#f8fafc] rounded-l-full border-l border-gray-100" />
                    <div className="mx-8 border-t-2 border-dashed border-gray-100" />
                </div>

                {/* QR Code Section */}
                <div className="px-8 pb-10 flex flex-col items-center">
                    <div className="p-4 bg-white rounded-3xl shadow-[0_10px_30px_rgba(16,185,129,0.1)] mb-4 border border-emerald-50">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ticket.uniqueTicketId}&color=064e3b`}
                            alt="QR Code"
                            className="w-40 h-40"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mb-1">Pass ID</p>
                    <p className="text-sm font-mono font-bold text-gray-700">{ticket.uniqueTicketId}</p>

                    {/* Status Badge */}
                    <div className="mt-6">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${ticket.status === 'valid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            ticket.status === 'checked-in' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${ticket.status === 'valid' ? 'bg-emerald-500' :
                                ticket.status === 'checked-in' ? 'bg-blue-500' :
                                    'bg-red-500'
                                }`}></span>
                            {ticket.status.replace('-', ' ')}
                        </span>
                    </div>
                </div>

                {/* Bottom Soft Emerald Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-emerald-50/30 to-transparent pointer-events-none" />
            </div>

            {/* Helpful Hint */}
            <p className="mt-8 text-gray-400 text-xs text-center max-w-[280px]">
                Please have this QR code ready to be scanned at the entrance. You can also download the PDF for offline access.
            </p>
        </div>
    );
};

export default TicketView;

