import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../../api/eventService";
import { AuthContext } from "../../context/auth";
import API from "../../api/axios";

const CreateEvent = () => {
    const navigate = useNavigate();
    const { user } = React.useContext(AuthContext);
    const [organizations, setOrganizations] = useState([]);

    const [formData, setFormData] = useState({
        organizerId: user?._id,
        organizerModel: 'User',
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
            backgroundImageUrl: "",
        },
        flyerFile: null,
        flyerPreview: "",
        uploadingFlyer: false,
        ticketTypes: [
            { name: "Regular", price: 0, quantity: 100, description: "" },
        ],
        sponsorship: {
            enabled: false,
            goal: 0,
            tiers: []
        },
        isPublic: true
    });

    React.useEffect(() => {
        // Fetch user's organizations
        // Assuming endpoint exists, otherwise we might need to rely on user profile or different endpoint
        // For now, try /organizations/mine or similar. If not, maybe /users/me/organizations
        async function loadOrgs() {
            try {
                const { data } = await API.get('/organizations/mine'); // Adjust endpoint if needed
                if (Array.isArray(data)) setOrganizations(data);
                else if (Array.isArray(data?.organizations)) setOrganizations(data.organizations);
            } catch (e) {
                console.log("Failed to load orgs", e);
            }
        }
        if (user) loadOrgs();
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'organizerId') {
            const isUser = value === user._id;
            setFormData(prev => ({
                ...prev,
                organizerId: value,
                organizerModel: isUser ? 'User' : 'Organization',
                // Reset sponsorship if switching to User
                sponsorship: isUser ? { ...prev.sponsorship, enabled: false } : prev.sponsorship
            }));
            return;
        }

        if (name.startsWith("branding.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                branding: { ...prev.branding, [field]: value },
            }));
        } else if (name.startsWith("sponsorship.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                sponsorship: { ...prev.sponsorship, [field]: type === 'checkbox' ? checked : value },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleFlyerChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, flyerFile: file, flyerPreview: previewUrl }));

        // Upload immediately
        setFormData(prev => ({ ...prev, uploadingFlyer: true }));
        try {
            const uploadData = new FormData();
            uploadData.append("image", file);

            // Note: server.js mounts uploadRoutes at /api/users
            const { data } = await API.post("/users/content-image", uploadData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (data?.url) {
                setFormData(prev => ({
                    ...prev,
                    branding: { ...prev.branding, backgroundImageUrl: data.url },
                    uploadingFlyer: false
                }));
            }
        } catch (error) {
            console.error("Flyer upload failed:", error);
            alert("Failed to upload flyer image. Please try again.");
            setFormData(prev => ({ ...prev, uploadingFlyer: false }));
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

    const addSponsorshipTier = () => {
        setFormData(prev => ({
            ...prev,
            sponsorship: {
                ...prev.sponsorship,
                tiers: [...prev.sponsorship.tiers, { name: "", amount: 0, benefits: [], color: "#000000" }]
            }
        }));
    };

    const updateSponsorshipTier = (index, field, value) => {
        const newTiers = [...formData.sponsorship.tiers];
        newTiers[index][field] = value;
        setFormData(prev => ({
            ...prev,
            sponsorship: { ...prev.sponsorship, tiers: newTiers }
        }));
    };

    const removeSponsorshipTier = (index) => {
        const newTiers = formData.sponsorship.tiers.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            sponsorship: { ...prev.sponsorship, tiers: newTiers }
        }));
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

                {/* Organizer Selection */}
                <div className="bg-gray-50 p-4 rounded-md border">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Create event as:</label>
                    <select
                        name="organizerId"
                        value={formData.organizerId}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                        <option value={user?._id}>{user?.name} (Personal)</option>
                        {organizations.map(org => (
                            <option key={org._id} value={org._id}>{org.name} (Organization)</option>
                        ))}
                    </select>
                </div>

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

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-emerald-900">Visibility</h3>
                        <p className="text-xs text-emerald-700">Public events appear in search. Private events are only accessible via link.</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                name="isPublic"
                                checked={formData.isPublic}
                                onChange={handleChange}
                                className="sr-only"
                            />
                            <div className={`block w-12 h-7 rounded-full transition-colors ${formData.isPublic ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.isPublic ? 'translate-x-5' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-semibold text-emerald-900">{formData.isPublic ? 'Public' : 'Private'}</span>
                    </label>
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
                                placeholder="https://example.com/logo.png"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Event Flyer/Banner Image</label>
                            <div className="mt-1 flex flex-col gap-2">
                                {formData.flyerPreview && (
                                    <div className="w-full h-32 rounded-md overflow-hidden bg-gray-100 border relative">
                                        <img src={formData.flyerPreview} className="w-full h-full object-cover" alt="Flyer Preview" />
                                        {formData.uploadingFlyer && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFlyerChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {formData.uploadingFlyer && <p className="text-[10px] text-indigo-600 font-medium italic">Uploading to server...</p>}
                            </div>
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

                {/* Sponsorship Section (Only if Organization) */}
                {formData.organizerModel === 'Organization' && (
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Sponsorship & Donations</h2>
                            <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" name="sponsorship.enabled" checked={formData.sponsorship.enabled} onChange={handleChange} className="sr-only" />
                                    <div className={`block w-10 h-6 rounded-full ${formData.sponsorship.enabled ? 'bg-indigo-600' : 'bg-gray-400'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${formData.sponsorship.enabled ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <div className="ml-3 text-gray-700 font-medium">Enable Sponsorship</div>
                            </label>
                        </div>

                        {formData.sponsorship.enabled && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Fundraising Goal</label>
                                    <input
                                        type="number"
                                        name="sponsorship.goal"
                                        value={formData.sponsorship.goal}
                                        onChange={handleChange}
                                        min="0"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">Sponsorship Tiers</h3>
                                    {formData.sponsorship.tiers.map((tier, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-md mb-4 border relative">
                                            <button
                                                type="button"
                                                onClick={() => removeSponsorshipTier(index)}
                                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Tier Name</label>
                                                    <input
                                                        type="text"
                                                        value={tier.name}
                                                        onChange={(e) => updateSponsorshipTier(index, 'name', e.target.value)}
                                                        placeholder="e.g. Gold Sponsor"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                                                    <input
                                                        type="number"
                                                        value={tier.amount}
                                                        onChange={(e) => updateSponsorshipTier(index, 'amount', e.target.value)}
                                                        min="0"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Color</label>
                                                    <input
                                                        type="color"
                                                        value={tier.color}
                                                        onChange={(e) => updateSponsorshipTier(index, 'color', e.target.value)}
                                                        className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm p-1 border"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addSponsorshipTier}
                                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                    >
                                        + Add Tier
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-6">
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Create Event
                    </button>
                </div>
            </form >
        </div >
    );
};

export default CreateEvent;
