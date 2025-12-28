import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { getMyEvents } from "../../api/eventService";

const MyEvents = () => {
    const [activeTab, setActiveTab] = useState('attending');
    const [tickets, setTickets] = useState([]);
    const [hostedEvents, setHostedEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                if (activeTab === 'attending') {
                    const { data } = await API.get("/tickets/mine");
                    setTickets(data);
                } else {
                    const data = await getMyEvents();
                    setHostedEvents(data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [activeTab]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
                {activeTab === 'hosting' && (
                    <Link
                        to="/events/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        + Create New Event
                    </Link>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('attending')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'attending'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Attending (Tickets)
                    </button>
                    <button
                        onClick={() => setActiveTab('hosting')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'hosting'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Hosting (Created)
                    </button>
                </nav>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {/* ATTENDING TAB CONTENT */}
                        {activeTab === 'attending' && (
                            <>
                                {tickets.map((ticket) => (
                                    <li key={ticket._id}>
                                        <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                                        {ticket.eventId?.title?.charAt(0) || 'E'}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-lg font-medium text-indigo-600 truncate">
                                                            {ticket.eventId?.title || 'Unknown Event'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {ticket.eventId ? `${new Date(ticket.eventId.date).toLocaleDateString()} at ${ticket.eventId.time}` : 'Date N/A'}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            Ticket ID: {ticket.uniqueTicketId}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-2">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.status === 'valid' ? 'bg-green-100 text-green-800' :
                                                        ticket.status === 'checked-in' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {ticket.status.toUpperCase()}
                                                    </span>
                                                    <Link
                                                        to={`/tickets/${ticket.uniqueTicketId}`}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                                    >
                                                        View Ticket
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {tickets.length === 0 && (
                                    <li className="px-4 py-10 text-center text-gray-500">
                                        You haven't booked any events yet.
                                    </li>
                                )}
                            </>
                        )}

                        {/* HOSTING TAB CONTENT */}
                        {activeTab === 'hosting' && (
                            <>
                                {hostedEvents.map((event) => (
                                    <li key={event._id}>
                                        <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl">
                                                        {event.title.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-lg font-medium text-emerald-700 truncate">
                                                            {event.title}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(event.date).toLocaleDateString()} at {event.time}
                                                        </div>
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {event.venue}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                                    <Link
                                                        to={`/organizer/checkin/${event._id}`}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
                                                    >
                                                        Scanner
                                                    </Link>
                                                    <Link
                                                        to={`/events/${event._id}`}
                                                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                    >
                                                        Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                {hostedEvents.length === 0 && (
                                    <li className="px-4 py-10 text-center text-gray-500 flex flex-col items-center gap-2">
                                        <p>You haven't hosted any events yet.</p>
                                        <Link
                                            to="/events/create"
                                            className="text-indigo-600 font-medium hover:text-indigo-800"
                                        >
                                            Create your first event
                                        </Link>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MyEvents;
