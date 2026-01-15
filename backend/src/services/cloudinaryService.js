import cloudinary from "../config/cloudinary.js";

/**
 * Extracts public_id from a Cloudinary URL.
 * Handles both public and authenticated (private) URLs.
 * @param {string} url - The Cloudinary URL
 * @returns {string|null} The public_id or null
 */
export const extractPublicId = (url) => {
    if (!url || typeof url !== "string") return null;

    // Example URLs:
    // https://res.cloudinary.com/demo/image/upload/v12345678/sample.jpg -> sample
    // https://res.cloudinary.com/demo/image/authenticated/s--abc--/v123/skillconnect/products/xyz.pdf -> skillconnect/products/xyz

    try {
        const parts = url.split("/");
        const uploadIndex = parts.indexOf("upload");
        const authIndex = parts.indexOf("authenticated");

        const index = uploadIndex !== -1 ? uploadIndex : authIndex;
        if (index === -1) return null;

        // The public_id starts after the version part (e.g., v12345678)
        // We skip parts until we find one starting with 'v' followed by numbers
        let startIndex = index + 1;
        while (startIndex < parts.length && !/^v\d+/.test(parts[startIndex])) {
            startIndex++;
        }

        // If we found a version part, public_id is everything after it (minus the extension)
        // If no version part, it might be right after the index (sometimes versions are omitted in API responses)
        const idPathParts = parts.slice(startIndex === parts.length ? index + 1 : startIndex + 1);
        const fullIdWithExt = idPathParts.join("/");

        // Remove extension
        return fullIdWithExt.split(".")[0];
    } catch (e) {
        console.error("Failed to extract public_id from URL:", url, e);
        return null;
    }
};

/**
 * Deletes a file from Cloudinary given its URL or public_id.
 * @param {string} urlOrId - The Cloudinary URL or public_id
 * @param {Object} options - Cloudinary destroy options (resource_type, type)
 */
export const deleteFromCloudinary = async (urlOrId, options = {}) => {
    if (!urlOrId) return;

    let publicId = urlOrId;
    if (urlOrId.startsWith("http")) {
        publicId = extractPublicId(urlOrId);
    }

    if (!publicId) return;

    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: options.resource_type || "image",
            type: options.type || "upload", // 'upload' for public, 'authenticated' for private
            ...options
        });
        return result;
    } catch (e) {
        console.error("Cloudinary delete failed for ID:", publicId, e);
        throw e;
    }
};
