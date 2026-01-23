import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyEvents } from "../../api/eventService";
import API from "../../api/axios";

const OrganizerEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [guestData, setGuestData] = useState({ name: "", email: "", ticketTypeId: "" });
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const data = await getMyEvents();
            setEvents(data);
        } catch (error) {
            console.error("Error fetching my events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviting(true);
        try {
            await API.post("/tickets/generate-guest", {
                eventId: selectedEvent._id,
                ...guestData
            });
            alert("Invitation sent successfully!");
            setShowInviteModal(false);
            setGuestData({ name: "", email: "", ticketTypeId: "" });
        } catch (error) {
            alert(error.response?.data?.message || "Failed to send invitation");
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
                <Link
                    to="/events/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Create New Event
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {events.map((event) => (
                            <li key={event._id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                                {event.title.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-indigo-600 truncate">{event.title}</div>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(event.date).toLocaleDateString()} at {event.time}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedEvent(event);
                                                    setGuestData({ ...guestData, ticketTypeId: event.ticketTypes[0]?._id });
                                                    setShowInviteModal(true);
                                                }}
                                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
                                            >
                                                Invite Guest
                                            </button>
                                            <Link
                                                to={`/organizer/checkin/${event._id}`}
                                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                            >
                                                Check-in
                                            </Link>
                                            <Link
                                                to={`/events/${event._id}`}
                                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                View Public Page
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                Venue: {event.venue}
                                            </p>
                                            {event.sponsorship?.enabled && (
                                                <p className="ml-4 flex items-center text-sm text-gray-500">
                                                    Raised: <span className="font-semibold text-emerald-600 ml-1">${event.sponsorship.raised || 0}</span>
                                                    {event.sponsorship.goal > 0 && <span className="ml-1">/ ${event.sponsorship.goal}</span>}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p>
                                                Status: <span className="font-semibold text-green-600">{event.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {events.length === 0 && (
                            <li className="px-4 py-10 text-center text-gray-500">
                                You haven't created any events yet.
                            </li>
                        )}
                    </ul>
                </div>
            )}
            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Invite Guest to {selectedEvent.title}</h2>
                        <p className="text-sm text-gray-500 mb-6">This will generate a complimentary ticket and email it to the guest.</p>

                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Guest Name</label>
                                <input
                                    required
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={guestData.name}
                                    onChange={e => setGuestData({ ...guestData, name: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Guest Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={guestData.email}
                                    onChange={e => setGuestData({ ...guestData, email: e.target.value })}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ticket Type</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={guestData.ticketTypeId}
                                    onChange={e => setGuestData({ ...guestData, ticketTypeId: e.target.value })}
                                >
                                    {selectedEvent.ticketTypes.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
                                >
                                    {inviting ? "Sending..." : "Generate Ticket"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizerEvents;
