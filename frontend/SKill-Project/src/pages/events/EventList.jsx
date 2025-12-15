import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../../api/eventService";

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ city: "", category: "" });

    useEffect(() => {
        fetchEvents();
    }, [filters]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await getEvents(filters);
            setEvents(data);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
                <Link
                    to="/events/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Create Event
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-8">
                <input
                    type="text"
                    name="city"
                    placeholder="Filter by City"
                    value={filters.city}
                    onChange={handleFilterChange}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
                <input
                    type="text"
                    name="category"
                    placeholder="Filter by Category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
            </div>

            {loading ? (
                <div className="text-center py-10">Loading events...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <Link key={event._id} to={`/events/${event._id}`} className="group">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                <div
                                    className="h-48 bg-gray-200 bg-cover bg-center"
                                    style={{
                                        backgroundImage: event.branding?.backgroundImageUrl ? `url(${event.branding.backgroundImageUrl})` : 'none',
                                        backgroundColor: event.branding?.primaryColor || '#e5e7eb'
                                    }}
                                >
                                    {event.branding?.logoUrl && (
                                        <img
                                            src={event.branding.logoUrl}
                                            alt="Logo"
                                            className="h-full w-full object-contain p-4"
                                        />
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-indigo-600 font-semibold">{event.category}</p>
                                            <h3 className="text-xl font-bold text-gray-900 mt-1 group-hover:text-indigo-600">
                                                {event.title}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-500">{event.time}</p>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-gray-600 line-clamp-2">{event.description}</p>
                                    <div className="mt-4 flex items-center text-sm text-gray-500">
                                        <span className="mr-2">📍</span>
                                        {event.venue}, {event.city}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {events.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No events found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventList;
