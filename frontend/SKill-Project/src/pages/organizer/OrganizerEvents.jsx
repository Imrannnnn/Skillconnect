import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyEvents } from "../../api/eventService";

const OrganizerEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

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
                                            <Link
                                                to={`/organizer/checkin/${event._id}`} // Pass event ID for context if needed
                                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                            >
                                                Check-in Scanner
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
        </div>
    );
};

export default OrganizerEvents;
