import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// --- Public Storage (Avatars, Covers, Content) ---
const publicStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // Determine folder based on fieldname or route if needed, 
        // but a general 'public' folder or subfolders is fine.
        let folder = 'skillconnect/public';

        // We can categorize by file field name
        if (file.fieldname === 'avatar') folder = 'skillconnect/avatars';
        if (file.fieldname === 'cover') folder = 'skillconnect/covers';
        if (file.fieldname === 'image') folder = 'skillconnect/images';

        return {
            folder: folder,
            resource_type: 'auto', // Detects image vs video
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'mkv', 'gif'],
            use_filename: true,
            unique_filename: true,
        };
    },
});

export const uploadPublic = multer({
    storage: publicStorage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit (videos)
});

// --- Private Storage (Digital Products) ---
const privateStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'skillconnect/products',
        resource_type: 'auto', // auto detects pdf, zip, etc (will be 'raw' or 'image' or 'video')
        type: 'authenticated', // Requires signed URL to access
        use_filename: true,
        unique_filename: true,
    },
});

export const uploadPrivate = multer({
    storage: privateStorage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB max for products
});

// --- Mixed Storage (Digital Product: Cover + File) ---
const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        if (file.fieldname === 'cover') {
            return {
                folder: 'skillconnect/public/covers',
                resource_type: 'image',
                allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
            };
        } else if (file.fieldname === 'file') {
            return {
                folder: 'skillconnect/private/products',
                resource_type: 'auto',
                type: 'authenticated', // Private file
                use_filename: true,
            };
        }
        return { folder: 'skillconnect/misc' };
    },
});

export const uploadDigitalProduct = multer({
    storage: productStorage,
    limits: { fileSize: 100 * 1024 * 1024 }
});
