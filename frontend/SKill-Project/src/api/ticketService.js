import axios from "./axios";

export const purchaseTickets = async (purchaseData) => {
    const response = await axios.post("/tickets/purchase", purchaseData);
    return response.data;
};

export const getTicket = async (ticketId) => {
    const response = await axios.get(`/tickets/${ticketId}`);
    return response.data;
};

export const checkInTicket = async (ticketId) => {
    const response = await axios.post("/tickets/check-in", { ticketId });
    return response.data;
};

export const getEventAnalytics = async (eventId) => {
    const response = await axios.get(`/tickets/analytics/${eventId}`);
    return response.data;
};
