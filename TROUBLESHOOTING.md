# Cloudinary Troubleshooting Guide

## Issues Fixed:
✅ Added `onPaste` handler to textarea
✅ Added `ref={commentInputRef}` to textarea 
✅ Added diagnostic test that auto-runs when page loads

## Next Steps to Get Everything Working:

### 1. **Create the Upload Preset (CRITICAL!)**

This is the most common reason for "Cloudinary not working":

1. Go to: https://console.cloudinary.com/settings/upload
2. Scroll to **"Upload Presets"**
3. Click **"Add upload preset"**
4. Settings:
   - **Preset name**: `project_uploads`
   - **Signing Mode**: **"Unsigned"** ← MUST be Unsigned!
   - **Folder**: (optional) `pms-uploads`
5. Click **"Save"**

### 2. **Verify Environment Variables**

Check your `.env` file in the project root contains:
```
VITE_CLOUDINARY_CLOUD_NAME=dhtowmv4x
VITE_CLOUDINARY_UPLOAD_PRESET=project_uploads
```

**IMPORTANT**: If you named your preset something different, update the second line!

### 3. **Restart Dev Server**

Environment variables only load when the server starts:
1. Stop the current dev server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. Wait for it to start

### 4. **Test the Setup**

Open the browser console (F12) and look for this message when you load any page:
```
=== Cloudinary Configuration Test ===
Cloud Name: dhtowmv4x
Upload Preset: project_uploads
✅ Configuration looks good!
```

If you see ❌ or errors:
- env variables aren't loading
- Server wasn't restarted after creating .env
- Upload preset name doesn't match

### 5. **Test Upload & Paste**

Navigate to:Post Productions → Click any entry → Go to comments

**Test Upload Button:**
1. Click "Upload Image"
2. Select an image
3. Should see preview immediately
4. Click "Post"
5. Should upload to Cloudinary

**Test Paste:**
1. Take a screenshot (Win+Shift+S or Cmd+Shift+4)
2. Click in the comment textarea
3. Press Ctrl+V (or Cmd+V)
4. Should see image preview appear
5. Click "Post"
6. Should upload to Cloudinary

### 6. **Check for Errors**

If still not working, open Console (F12) and look for:

**Missing Environment Variables:**
```
❌ NOT FOUND
```
→ Restart dev server after creating .env

**401 Unauthorized from Cloudinary:**
```
POST https://api.cloudinary.com/v1_1/dhtowmv4x/image/upload 401
```
→ Upload preset not created OR signing mode is not "Unsigned"

**404 Not Found:**
```
POST https://api.cloudinary.com/v1_1/dhtowmv4x/image/upload 404
```
→ Cloud name is wrong in .env

**Network Error:**
→ Check internet connection
→ Check if Cloudinary is blocked by firewall

### 7. **Common Mistakes**

❌ Preset signing mode is "Signed" (must be "Unsigned")
❌ Forgot to restart dev server after creating .env
❌ Upload preset name doesn't match the .env value
❌ Typo in cloud name
❌ .env file is named wrong (should be exactly `.env`)

### 8. **Success Indicators**

You'll know it's working when:
✅ Console shows "Configuration looks good!"
✅ Paste shows image preview instantly
✅ Upload button shows file picker
✅ Progress bar appears during upload
✅ Comment posts with image visible
✅ Image can be clicked to view full size

---

## Quick Debug Commands

**In browser console, run:**
```javascript
// Check if env variables are loaded
console.log('Cloud:', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
console.log('Preset:', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
```

Should show:
```
Cloud: dhtowmv4x
Preset: project_uploads
```

If shows `undefined`, restart dev server!
