import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    currentImage?: string;
    onImageUploaded: (url: string) => void;
    label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageUploaded, label = "Imagen del Producto/Marca" }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            // 1. Compress Image
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);

            // 2. Convert to base64

            const reader = new FileReader();
            const fileData = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(compressedFile);
            });

            // 3. Upload via server
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    fileData,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Server error details:', errorData);
                throw new Error(errorData.details || errorData.error || 'Failed to upload image');
            }

            const { publicUrl } = await res.json();

            // 4. Update State
            setPreview(publicUrl);
            onImageUploaded(publicUrl);
            console.log('Image uploaded successfully:', publicUrl);

        } catch (err: any) {
            console.error('Upload error:', err);
            setError('Error al subir la imagen. Intenta nuevamente.');
        } finally {
            setUploading(false);
        }
    };


    const handleRemove = () => {
        setPreview(null);
        onImageUploaded('');
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 ml-1">{label}</label>

            <div className="relative group">
                {preview ? (
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-slate-500 hover:text-red-500 hover:bg-white transition-colors shadow-sm"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <label className={`
                        flex flex-col items-center justify-center w-full h-32 
                        rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 
                        cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                            ) : (
                                <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-slate-500" />
                            )}
                            <p className="mb-1 text-sm text-slate-500 font-bold">
                                {uploading ? 'Comprimiendo y Subiendo...' : 'Click para subir imagen'}
                            </p>
                            <p className="text-xs text-slate-400">SVG, PNG, JPG or WEBP (MAX. 1MB)</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>
            {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
        </div>
    );
};

export default ImageUpload;
