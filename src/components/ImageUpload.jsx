import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import { uploadImage, getThumbnailUrl } from '../utils/cloudinary';

/**
 * Reusable Image Upload Component
 * 
 * @param {Object} props
 * @param {string} props.value - Current image URL
 * @param {Function} props.onChange - Callback when image is uploaded (receives url)
 * @param {string} props.folder - Cloudinary folder name
 * @param {string} props.label - Label text
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.showPreview - Whether to show image preview
 * @param {number} props.maxSizeMB - Maximum file size in MB (default 5)
 * @param {string[]} props.acceptedTypes - Accepted MIME types
 */
const ImageUpload = ({
    value = '',
    onChange,
    folder = 'uploads',
    label = 'Upload Image',
    placeholder = 'Click or drag to upload',
    showPreview = true,
    maxSizeMB = 5,
    acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleFile = async (file) => {
        // Validate file type
        if (!acceptedTypes.includes(file.type)) {
            setError(`Invalid file type. Accepted: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`);
            return;
        }

        // Validate file size
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`File too large. Maximum size: ${maxSizeMB}MB`);
            return;
        }

        setError('');
        setUploading(true);
        setProgress(0);

        try {
            const result = await uploadImage(file, {
                folder,
                onProgress: setProgress
            });

            onChange(result.url);
            setProgress(100);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleRemove = () => {
        onChange('');
        setProgress(0);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const containerStyle = {
        border: `2px dashed ${dragActive ? 'var(--accent-color)' : error ? 'var(--danger)' : 'var(--border-color)'}`,
        borderRadius: '12px',
        padding: '1.5rem',
        textAlign: 'center',
        backgroundColor: dragActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-card)',
        transition: 'all 0.2s ease',
        cursor: uploading ? 'not-allowed' : 'pointer',
        position: 'relative',
        overflow: 'hidden'
    };

    const previewStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
    };

    const imageStyle = {
        width: '80px',
        height: '80px',
        objectFit: 'cover',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
    };

    // Show preview if we have a value
    if (value && showPreview) {
        return (
            <div className="form-group">
                {label && <label style={{ marginBottom: '0.5rem', display: 'block' }}>{label}</label>}
                <div style={previewStyle}>
                    <img
                        src={getThumbnailUrl(value, 160)}
                        alt="Uploaded"
                        style={imageStyle}
                    />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--success)',
                            marginBottom: '0.25rem'
                        }}>
                            <Check size={16} />
                            <span style={{ fontWeight: 500 }}>Image uploaded</span>
                        </div>
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                fontSize: '0.8rem',
                                color: 'var(--accent-color)',
                                textDecoration: 'underline'
                            }}
                        >
                            View full image
                        </a>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        style={{
                            background: 'var(--danger)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Remove image"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="form-group">
            {label && <label style={{ marginBottom: '0.5rem', display: 'block' }}>{label}</label>}
            <div
                style={containerStyle}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={acceptedTypes.join(',')}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                    disabled={uploading}
                />

                {uploading ? (
                    <div>
                        <Loader2
                            size={40}
                            className="spin"
                            style={{ color: 'var(--accent-color)', marginBottom: '0.75rem' }}
                        />
                        <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 500 }}>
                            Uploading... {progress}%
                        </p>
                        <div style={{
                            width: '100%',
                            height: '4px',
                            backgroundColor: 'var(--border-color)',
                            borderRadius: '2px',
                            marginTop: '0.75rem',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: 'var(--accent-color)',
                                transition: 'width 0.2s ease'
                            }} />
                        </div>
                    </div>
                ) : (
                    <div>
                        {dragActive ? (
                            <Upload
                                size={40}
                                style={{ color: 'var(--accent-color)', marginBottom: '0.75rem' }}
                            />
                        ) : (
                            <ImageIcon
                                size={40}
                                style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}
                            />
                        )}
                        <p style={{
                            margin: 0,
                            color: dragActive ? 'var(--accent-color)' : 'var(--text-primary)',
                            fontWeight: 500
                        }}>
                            {dragActive ? 'Drop image here' : placeholder}
                        </p>
                        <p style={{
                            margin: '0.5rem 0 0',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)'
                        }}>
                            JPG, PNG, GIF or WebP (max {maxSizeMB}MB)
                        </p>
                    </div>
                )}

                {error && (
                    <p style={{
                        margin: '0.75rem 0 0',
                        color: 'var(--danger)',
                        fontSize: '0.85rem'
                    }}>
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
