/**
 * Cloudinary Configuration Test
 * Run this in the browser console to check if env variables are loaded
 */

export const testCloudinaryConfig = () => {
    console.log('=== Cloudinary Configuration Test ===');

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    console.log('Cloud Name:', cloudName || '❌ NOT FOUND');
    console.log('Upload Preset:', uploadPreset || '❌ NOT FOUND');

    if (!cloudName || !uploadPreset) {
        console.error('⚠️ PROBLEM FOUND:');
        console.error('Environment variables are missing!');
        console.error('Make sure:');
        console.error('1. .env file exists in project root');
        console.error('2. Dev server was restarted after creating .env');
        console.error('3. Variables start with VITE_ prefix');
        return false;
    }

    console.log('✅ Configuration looks good!');
    console.log(`Upload URL will be: https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    return true;
};

// Auto-run on import
testCloudinaryConfig();
