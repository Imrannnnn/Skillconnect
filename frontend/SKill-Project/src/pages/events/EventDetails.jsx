import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventById } from "../../api/eventService";
import { purchaseTickets } from "../../api/ticketService";
import API from "../../api/axios";
import { AuthContext } from "../../context/auth";

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTickets, setSelectedTickets] = useState({}); // { ticketTypeId: quantity }
    const [guestDetails, setGuestDetails] = useState({ name: "", email: "", phone: "" });
    const [processing, setProcessing] = useState(false);

    // Support/Donation State
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [supportType, setSupportType] = useState('donation'); // 'donation' or 'sponsorship'
    const [selectedTier, setSelectedTier] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [supportMessage, setSupportMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await getEventById(id);
                setEvent(data);
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleQuantityChange = (ticketTypeId, quantity) => {
        setSelectedTickets((prev) => ({
            ...prev,
            [ticketTypeId]: parseInt(quantity) || 0,
        }));
    };

    const handleGuestChange = (e) => {
        setGuestDetails({ ...guestDetails, [e.target.name]: e.target.value });
    };

    const calculateTotal = () => {
        if (!event) return 0;
        return event.ticketTypes.reduce((total, type) => {
            const qty = selectedTickets[type._id] || 0;
            return total + (qty * type.price);
        }, 0);
    };

    const handlePurchase = async () => {
        try {
            setProcessing(true);
            const items = Object.entries(selectedTickets)
                .filter((entry) => entry[1] > 0)
                .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

            if (items.length === 0) {
                alert("Please select at least one ticket.");
                setProcessing(false);
                return;
            }

            const purchaseData = {
                eventId: event._id,
                items,
                guestDetails: user ? null : guestDetails,
                paymentDetails: {
                    paymentMethod: "credit_card", // Mock
                    transactionId: "TXN-" + Date.now(),
                },
            };

            const result = await purchaseTickets(purchaseData);

            // Redirect to first ticket view or a success page
            // For now, just alert and maybe go to the first ticket
            if (result.tickets && result.tickets.length > 0) {
                navigate(`/tickets/${result.tickets[0].uniqueTicketId}`);
            } else {
                alert("Purchase successful!");
                navigate("/events");
            }

        } catch (error) {
            console.error("Purchase failed:", error);
            alert(error.response?.data?.message || "Purchase failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleSupport = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("Please login to support this event");
            navigate("/login");
            return;
        }

        try {
            setProcessing(true);
            const amount = supportType === 'sponsorship' ? selectedTier.amount : Number(donationAmount);

            await API.post(`/events/${event._id}/support`, {
                eventId: event._id,
                amount,
                type: supportType,
                tierId: selectedTier?._id,
                message: supportMessage,
                isAnonymous
            });

            alert("Thank you for your support!");
            setShowSupportModal(false);
            fetchEvent(); // Refresh to update raised amount
        } catch (error) {
            console.error("Support failed:", error);
            alert(error.response?.data?.message || "Support failed");
        } finally {
            setProcessing(false);
        }
    };



    if (loading) return <div className="text-center py-10">Loading...</div>;
    if (!event) return <div className="text-center py-10">Event not found</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Event Header */}
            <div
                className="h-64 rounded-xl bg-cover bg-center relative mb-8"
                style={{
                    backgroundImage: event.branding?.backgroundImageUrl ? `url(${event.branding.backgroundImageUrl})` : 'none',
                    backgroundColor: event.branding?.primaryColor || '#4f46e5'
                }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl flex items-end p-8">
                    <div className="text-white">
                        <span className="bg-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            {event.category}
                        </span>
                        <h1 className="text-4xl font-bold mt-2">{event.title}</h1>
                        <p className="mt-2 text-lg opacity-90">
                            {new Date(event.date).toLocaleDateString()} at {event.time} • {event.venue}, {event.city}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">About this Event</h2>
                        <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">Select Tickets</h2>
                        <div className="space-y-4">
                            {event.ticketTypes.map((type) => (
                                <div key={type._id} className="flex justify-between items-center p-4 border rounded-lg hover:border-indigo-300 transition-colors">
                                    <div>
                                        <h3 className="font-bold text-lg">{type.name}</h3>
                                        <p className="text-sm text-gray-500">{type.description}</p>
                                        <p className="text-indigo-600 font-semibold mt-1">${type.price}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {type.quantity - type.sold <= 0 ? (
                                            <span className="text-red-500 font-bold">Sold Out</span>
                                        ) : (
                                            <select
                                                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                                                value={selectedTickets[type._id] || 0}
                                                onChange={(e) => handleQuantityChange(type._id, e.target.value)}
                                            >
                                                {[...Array(Math.min(10, type.quantity - type.sold) + 1).keys()].map(num => (
                                                    <option key={num} value={num}>{num}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Checkout Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-lg border sticky top-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Order Summary</h2>

                        <div className="space-y-2 mb-4">
                            {event.ticketTypes.map((type) => {
                                const qty = selectedTickets[type._id] || 0;
                                if (qty === 0) return null;
                                return (
                                    <div key={type._id} className="flex justify-between text-sm">
                                        <span>{qty} x {type.name}</span>
                                        <span>${qty * type.price}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="border-t pt-4 mb-6">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${calculateTotal()}</span>
                            </div>
                        </div>

                        {!user && (
                            <div className="mb-6 space-y-3">
                                <h3 className="font-semibold text-gray-700">Guest Details</h3>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    value={guestDetails.name}
                                    onChange={handleGuestChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={guestDetails.email}
                                    onChange={handleGuestChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone (Optional)"
                                    value={guestDetails.phone}
                                    onChange={handleGuestChange}
                                    className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                />
                            </div>
                        )}

                        <button
                            onClick={handlePurchase}
                            disabled={processing || Object.values(selectedTickets).reduce((a, b) => a + b, 0) === 0}
                            className={`w-full py-3 px-4 rounded-md text-white font-bold text-lg shadow-md transition-colors ${processing || Object.values(selectedTickets).reduce((a, b) => a + b, 0) === 0
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            {processing ? "Processing..." : (calculateTotal() > 0 ? "Complete Order" : "Get Tickets")}
                        </button>
                    </div>
                </div>
            </div>
            {/* Support Modal */}
            {showSupportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
                        <button
                            onClick={() => setShowSupportModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>

                        <h2 className="text-2xl font-bold mb-4">
                            {supportType === 'sponsorship' ? `Sponsor: ${selectedTier.name}` : 'Make a Donation'}
                        </h2>

                        <form onSubmit={handleSupport} className="space-y-4">
                            {supportType === 'donation' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                                    <input
                                        type="number"
                                        value={donationAmount}
                                        onChange={(e) => setDonationAmount(e.target.value)}
                                        min="1"
                                        required
                                        className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                        placeholder="Enter amount"
                                    />
                                </div>
                            )}

                            {supportType === 'sponsorship' && (
                                <div className="p-3 bg-gray-50 rounded-md mb-4">
                                    <p className="text-sm text-gray-600">Amount to pay:</p>
                                    <p className="text-xl font-bold text-gray-900">${selectedTier.amount}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                                <textarea
                                    value={supportMessage}
                                    onChange={(e) => setSupportMessage(e.target.value)}
                                    rows="3"
                                    className="w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                    placeholder="Leave a message of support..."
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="anon"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                />
                                <label htmlFor="anon" className="ml-2 block text-sm text-gray-900">
                                    Support anonymously
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 bg-emerald-600 text-white rounded-md font-bold hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : `Pay $${supportType === 'sponsorship' ? selectedTier.amount : donationAmount}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetails;
