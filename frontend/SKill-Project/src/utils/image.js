export const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    // Default to localhost:5000 if VITE_API_BASE is not set or doesn't contain the root
    // Assuming VITE_API_BASE is like "http://localhost:5000/api/v1"
    let baseUrl = "http://localhost:5000";

    if (import.meta.env.VITE_API_BASE) {
        try {
            const url = new URL(import.meta.env.VITE_API_BASE);
            baseUrl = url.origin;
        } catch {
            // ignore invalid url
        }
    }

    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};
