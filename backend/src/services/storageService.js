import fs from "fs";
import path from "path";
import { promisify } from "util";
import crypto from "crypto";

// Ensure the private uploads directory exists
// Ensure the private uploads directory exists
const PRIVATE_DIR = path.join(process.cwd(), "src", "uploads", "private");
if (!fs.existsSync(PRIVATE_DIR)) {
    fs.mkdirSync(PRIVATE_DIR, { recursive: true });
}

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

/**
 * Saves a file buffer to private secure storage.
 * @param {Buffer} buffer - The file content
 * @param {string} originalName - Original filename (for extension)
 * @returns {Promise<{ key: string, size: number, mimeType: string }>} Storage key and metadata
 */
export const uploadFile = async (buffer, originalName, mimeType) => {
    // Generate a random secure filename
    const ext = path.extname(originalName) || "";
    const randomName = crypto.randomBytes(16).toString("hex") + ext;
    const filePath = path.join(PRIVATE_DIR, randomName);

    await writeFileAsync(filePath, buffer);

    return {
        key: randomName, // In local storage, the key is the filename
        size: buffer.length,
        mimeType,
    };
};

/**
 * Deletes a file from storage.
 * @param {string} key - The storage key (filename)
 */
export const deleteFile = async (key) => {
    if (!key) return;
    const filePath = path.join(PRIVATE_DIR, key);
    try {
        if (fs.existsSync(filePath)) {
            await unlinkAsync(filePath);
        }
    } catch (err) {
        console.error("Failed to delete file:", key, err);
    }
};

/**
 * Gets a read stream for the file.
 * Throws error if file doesn't exist.
 * @param {string} key - The storage key
 * @returns {fs.ReadStream}
 */
export const getFileStream = (key) => {
    const filePath = path.join(PRIVATE_DIR, key);
    if (!fs.existsSync(filePath)) {
        throw new Error("File not found");
    }
    return fs.createReadStream(filePath);
};

/**
 * Gets the absolute path for a file (Local storage only).
 * Useful for checking stats or manual serving if needed.
 * @param {string} key 
 * @returns {string}
 */
export const getLocalFilePath = (key) => {
    return path.join(PRIVATE_DIR, key);
};
