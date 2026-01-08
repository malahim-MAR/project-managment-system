# Cloudinary Setup Guide

## Quick Setup Instructions

You need to create an **unsigned upload preset** in Cloudinary to complete the setup:

### Steps:

1. Go to [Cloudinary Console - Upload Settings](https://console.cloudinary.com/settings/upload)
2. Scroll down to **"Upload presets"**
3. Click **"Add upload preset"**
4. Configure the preset:
   - **Preset name**: `project_uploads` (or any name you prefer)
   - **Signing Mode**: Select **"Unsigned"** (this is crucial!)
   - **Folder**: You can optionally set a default folder like `pms-uploads`
   - Leave other settings as default
5. Click **"Save"**
6. Update the `.env` file with your preset name if different from `project_uploads`

### Your Current Configuration:

In the `.env` file:
```
VITE_CLOUDINARY_CLOUD_NAME=dhtowmv4x
VITE_CLOUDINARY_UPLOAD_PRESET=project_uploads
```

If you named your preset something different, update `VITE_CLOUDINARY_UPLOAD_PRESET` to match.

### Testing:

1. Restart the dev server (already done - running on http://localhost:5174)
2. Navigate to any post-production details page
3. Try adding a comment with an image:
   - Click "Upload Image" button, OR
   - Copy an image and paste it (Ctrl+V/Cmd+V) into the comment box

## Features Implemented:

✅ **Image Upload Button**: Upload images from your device
✅ **Clipboard Paste**: Paste images directly from clipboard (screenshots, copied images)
✅ **Image Preview**: See images before posting
✅ **Progress Tracking**: Visual upload progress indicator
✅ **File Validation**: Automatically validates file type and size
✅ **Cloudinary Integration**: Images are uploaded to Cloudinary and URLs saved to Firestore
✅ **Optimized Display**: Images show as thumbnails in comments, click to view full size

## File Size & Type Limits:

- **Max Size**: 5MB per image
- **Allowed Types**: JPG, PNG, GIF, WebP
