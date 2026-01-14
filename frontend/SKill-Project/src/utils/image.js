export const getImageUrl = (path) => {
    if (!path) return "";

    const sPath = String(path).trim();
    if (
        sPath.startsWith("http://") ||
        sPath.startsWith("https://") ||
        sPath.startsWith("blob:") ||
        sPath.startsWith("data:") ||
        sPath.startsWith("//")
    ) {
        return sPath;
    }

    // Default to localhost:5000 if VITE_API_BASE is not set or doesn't contain the root
    let baseUrl = "http://localhost:5000";

    if (import.meta.env.VITE_API_BASE) {
        try {
            const url = new URL(import.meta.env.VITE_API_BASE);
            baseUrl = url.origin;
        } catch {
            // ignore invalid url
        }
    }

    return `${baseUrl}${sPath.startsWith("/") ? "" : "/"}${sPath}`;
};
