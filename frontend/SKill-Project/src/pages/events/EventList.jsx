import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../../api/eventService";

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ city: "", category: "" });

    useEffect(() => {
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

        fetchEvents();
    }, [filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Hero / CTA Section */}
            <div className="bg-indigo-700 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Discover Amazing Events</h1>
                        <p className="mt-2 text-indigo-100 text-lg">Find your next experience or host your own.</p>
                    </div>
                    <Link
                        to="/events/create"
                        className="hidden md:inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 shadow-sm transition-all transform hover:scale-105"
                    >
                        + Create an Event
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <input
                        type="text"
                        name="city"
                        placeholder="Filter by City"
                        value={filters.city}
                        onChange={handleFilterChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    />
                    <input
                        type="text"
                        name="category"
                        placeholder="Filter by Category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
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
                {/* Mobile Floating Action Button */}
                <Link
                    to="/events/create"
                    className="md:hidden fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-50 transition-transform active:scale-95"
                    aria-label="Create Event"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </Link>
            </div>
        </div>
    );
};

export default EventList;
