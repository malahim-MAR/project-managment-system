/**
 * Cloudinary Upload Utility
 * 
 * This utility handles image uploads to Cloudinary using their unsigned upload API.
 * It returns secure URLs that can be stored in Firebase.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads an image file to Cloudinary
 * 
 * @param {File} file - The file object to upload
 * @param {Object} options - Optional configuration
 * @param {string} options.folder - Folder name in Cloudinary (e.g., 'avatars', 'projects')
 * @param {Function} options.onProgress - Progress callback (receives 0-100)
 * @returns {Promise<Object>} - Returns { url, publicId, width, height, format }
 */
export const uploadImage = async (file, options = {}) => {
    const { folder = 'uploads', onProgress } = options;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error('Cloudinary configuration is missing. Check your .env file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                resolve({
                    url: response.secure_url,
                    publicId: response.public_id,
                    width: response.width,
                    height: response.height,
                    format: response.format,
                    bytes: response.bytes
                });
            } else {
                reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
        });

        xhr.send(formData);
    });
};

/**
 * Uploads multiple images to Cloudinary
 * 
 * @param {FileList|File[]} files - Array of file objects
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object[]>} - Returns array of upload results
 */
export const uploadMultipleImages = async (files, options = {}) => {
    const uploads = Array.from(files).map(file => uploadImage(file, options));
    return Promise.all(uploads);
};

/**
 * Generates an optimized Cloudinary URL with transformations
 * 
 * @param {string} url - Original Cloudinary URL
 * @param {Object} transforms - Transformation options
 * @param {number} transforms.width - Desired width
 * @param {number} transforms.height - Desired height
 * @param {string} transforms.crop - Crop mode (fill, fit, scale, etc.)
 * @param {string} transforms.quality - Quality (auto, auto:low, auto:good, etc.)
 * @returns {string} - Transformed URL
 */
export const getOptimizedUrl = (url, transforms = {}) => {
    if (!url || !url.includes('cloudinary.com')) {
        return url;
    }

    const {
        width,
        height,
        crop = 'fill',
        quality = 'auto',
        format = 'auto'
    } = transforms;

    // Build transformation string
    const parts = [];
    if (width) parts.push(`w_${width}`);
    if (height) parts.push(`h_${height}`);
    if (crop) parts.push(`c_${crop}`);
    if (quality) parts.push(`q_${quality}`);
    if (format) parts.push(`f_${format}`);

    if (parts.length === 0) return url;

    const transformString = parts.join(',');

    // Insert transformations into URL
    return url.replace('/upload/', `/upload/${transformString}/`);
};

/**
 * Generates a thumbnail URL from a Cloudinary image
 * 
 * @param {string} url - Original Cloudinary URL
 * @param {number} size - Thumbnail size (default 150)
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (url, size = 150) => {
    return getOptimizedUrl(url, {
        width: size,
        height: size,
        crop: 'fill',
        quality: 'auto:low'
    });
};

export default {
    uploadImage,
    uploadMultipleImages,
    getOptimizedUrl,
    getThumbnailUrl
};
