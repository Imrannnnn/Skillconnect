import axios from "./axios";

export const createEvent = async (eventData) => {
    const response = await axios.post("/events", eventData);
    return response.data;
};

export const getEvents = async (filters) => {
    const response = await axios.get("/events", { params: filters });
    return response.data;
};

export const getEventById = async (id) => {
    const response = await axios.get(`/events/${id}`);
    return response.data;
};

export const getMyEvents = async () => {
    const response = await axios.get("/events/my-events");
    return response.data;
};

export const updateEvent = async (id, data) => {
    const response = await axios.put(`/events/${id}`, data);
    return response.data;
};

export const deleteEvent = async (id) => {
    const response = await axios.delete(`/events/${id}`);
    return response.data;
};
