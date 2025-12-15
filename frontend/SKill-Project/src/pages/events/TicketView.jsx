import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTicket } from "../../api/ticketService";

const TicketView = () => {
    const { id } = useParams(); // uniqueTicketId
    const [ticketData, setTicketData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTicket();
    }, [id]);

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

    const handleDownload = () => {
        window.print();
    };

    if (loading) return <div className="text-center py-10">Loading ticket...</div>;
    if (!ticketData) return <div className="text-center py-10">Ticket not found</div>;

    const { ticket, ticketType } = ticketData;
    const event = ticket.eventId;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center print:bg-white print:p-0">
            <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none">

                {/* Event Header */}
                <div
                    className="h-32 bg-cover bg-center relative"
                    style={{
                        backgroundImage: event.branding?.backgroundImageUrl ? `url(${event.branding.backgroundImageUrl})` : 'none',
                        backgroundColor: event.branding?.primaryColor || '#4f46e5'
                    }}
                >
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <h2 className="text-2xl font-bold text-white text-center px-4">{event.title}</h2>
                    </div>
                </div>

                <div className="p-8">
                    {/* Ticket Info */}
                    <div className="text-center mb-8">
                        <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Ticket Type</p>
                        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">{ticketType.name}</h1>
                        <p className="text-indigo-600 font-bold text-xl mt-2">{ticket.holderName}</p>
                    </div>

                    <div className="border-t border-b border-dashed border-gray-300 py-6 mb-6 space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="font-semibold text-gray-900">{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Time</span>
                            <span className="font-semibold text-gray-900">{event.time}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Venue</span>
                            <span className="font-semibold text-gray-900 text-right">{event.venue}, {event.city}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ticket ID</span>
                            <span className="font-mono font-semibold text-gray-900">{ticket.uniqueTicketId}</span>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket.uniqueTicketId}`}
                            alt="Ticket QR Code"
                            className="w-48 h-48 border-4 border-white shadow-lg"
                        />
                        <p className="text-xs text-gray-400 mt-2">Scan at entrance</p>
                    </div>

                    {/* Status Badge */}
                    <div className="text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ticket.status === 'valid' ? 'bg-green-100 text-green-800' :
                                ticket.status === 'checked-in' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                            }`}>
                            {ticket.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-8 py-4 flex justify-between items-center print:hidden">
                    <button
                        onClick={() => window.history.back()}
                        className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                        &larr; Back
                    </button>
                    <button
                        onClick={handleDownload}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
                    >
                        Download / Print
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketView;
