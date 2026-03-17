import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: File[];
  existingImages?: { url: string; publicId: string }[];
  onChange: (files: File[]) => void;
  onRemoveExisting?: (publicId: string) => void;
  maxImages?: number;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  existingImages = [],
  onChange,
  onRemoveExisting,
  maxImages = 5,
  error,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const totalImages = existingImages.length + images.length;
  const canAdd = totalImages < maxImages;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (!canAdd) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      const slotsAvailable = maxImages - totalImages;
      const newFiles = files.slice(0, slotsAvailable);

      onChange([...images, ...newFiles]);
    },
    [canAdd, images, maxImages, totalImages, onChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;

      const files = Array.from(e.target.files).filter((f) =>
        f.type.startsWith('image/')
      );
      const slotsAvailable = maxImages - totalImages;
      const newFiles = files.slice(0, slotsAvailable);

      onChange([...images, ...newFiles]);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [images, maxImages, totalImages, onChange]
  );

  const removeNewImage = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      onChange(updated);
    },
    [images, onChange]
  );

  return (
    <div>
      <label className="label">
        Product Images ({totalImages}/{maxImages})
      </label>

      {/* Existing + New image previews */}
      {(existingImages.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
          {/* Existing images */}
          {existingImages.map((img) => (
            <div
              key={img.publicId}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
            >
              <img
                src={img.url}
                alt="Product"
                className="w-full h-full object-cover"
              />
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(img.publicId)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* New images (File objects) */}
          {images.map((file, index) => (
            <div
              key={`new-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-earth-200 group"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeNewImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-earth-900 text-white text-[10px] text-center py-0.5">
                New
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canAdd && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-earth-900 bg-earth-50'
              : 'border-earth-300 hover:border-earth-600 hover:bg-earth-50'
          } ${error ? 'border-red-400' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('image-upload-input')?.click()}
        >
          <input
            id="image-upload-input"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            {totalImages === 0 ? (
              <ImageIcon className="h-10 w-10 text-earth-400" />
            ) : (
              <Upload className="h-8 w-8 text-earth-400" />
            )}
            <div>
              <p className="text-sm font-medium text-earth-600">
                {totalImages === 0
                  ? 'Click or drag images to upload'
                  : `Add more images (${maxImages - totalImages} remaining)`}
              </p>
              <p className="text-xs text-earth-400 mt-1">
                JPEG, PNG, GIF, or WebP up to 5MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ImageUpload;
