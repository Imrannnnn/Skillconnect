import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../../api/eventService";

const CreateEvent = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        venue: "",
        city: "",
        category: "",
        branding: {
            logoUrl: "",
            primaryColor: "#000000",
            secondaryColor: "#ffffff",
        },
        ticketTypes: [
            { name: "Regular", price: 0, quantity: 100, description: "" },
        ],
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("branding.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                branding: { ...prev.branding, [field]: value },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleTicketChange = (index, e) => {
        const { name, value } = e.target;
        const newTicketTypes = [...formData.ticketTypes];
        newTicketTypes[index][name] = value;
        setFormData((prev) => ({ ...prev, ticketTypes: newTicketTypes }));
    };

    const addTicketType = () => {
        setFormData((prev) => ({
            ...prev,
            ticketTypes: [
                ...prev.ticketTypes,
                { name: "", price: 0, quantity: 0, description: "" },
            ],
        }));
    };

    const removeTicketType = (index) => {
        const newTicketTypes = [
            ...formData.ticketTypes.slice(0, index),
            ...formData.ticketTypes.slice(index + 1)
        ];
        setFormData((prev) => ({ ...prev, ticketTypes: newTicketTypes }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createEvent(formData);
            navigate("/events"); // Redirect to event list
        } catch (error) {
            console.error("Error creating event:", error);
            alert("Failed to create event");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Event</h1>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Event Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <input
                            type="time"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Venue</label>
                        <input
                            type="text"
                            name="venue"
                            value={formData.venue}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="4"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    />
                </div>

                {/* Branding */}
                <div className="border-t pt-4">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Branding</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                            <input
                                type="text"
                                name="branding.logoUrl"
                                value={formData.branding.logoUrl}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                            <input
                                type="color"
                                name="branding.primaryColor"
                                value={formData.branding.primaryColor}
                                onChange={handleChange}
                                className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                            <input
                                type="color"
                                name="branding.secondaryColor"
                                value={formData.branding.secondaryColor}
                                onChange={handleChange}
                                className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border"
                            />
                        </div>
                    </div>
                </div>

                {/* Ticket Types */}
                <div className="border-t pt-4">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Ticket Types</h2>
                    {formData.ticketTypes.map((ticket, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-md mb-4 border relative">
                            <button
                                type="button"
                                onClick={() => removeTicketType(index)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            >
                                Remove
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={ticket.name}
                                        onChange={(e) => handleTicketChange(index, e)}
                                        required
                                        placeholder="e.g. VIP"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Price</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={ticket.price}
                                        onChange={(e) => handleTicketChange(index, e)}
                                        required
                                        min="0"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={ticket.quantity}
                                        onChange={(e) => handleTicketChange(index, e)}
                                        required
                                        min="1"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={ticket.description}
                                        onChange={(e) => handleTicketChange(index, e)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addTicketType}
                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        + Add Ticket Type
                    </button>
                </div>

                <div className="pt-6">
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Create Event
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEvent;
