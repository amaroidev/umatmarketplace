import multer from 'multer';
import cloudinary from '../config/cloudinary';
import ApiError from './ApiError';
import fs from 'fs';
import path from 'path';

// Configure multer for memory storage (buffer, not disk)
const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Max 5 files
  },
});

/**
 * Upload a single image buffer to Cloudinary
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = 'campusmarketplace/products'
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit', quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(ApiError.internal(`Failed to upload image to cloud storage: ${error.message || 'unknown error'}`));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Upload multiple image buffers to Cloudinary
 */
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder: string = 'campusmarketplace/products'
): Promise<{ url: string; publicId: string }[]> => {
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.buffer, folder)
  );
  return Promise.all(uploadPromises);
};

const guessImageExtension = (mime: string): string => {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
};

export const uploadMultipleWithFallback = async (
  files: Express.Multer.File[],
  reqMeta: { protocol: string; host: string },
  folder: string = 'campusmarketplace/products'
): Promise<{ url: string; publicId: string }[]> => {
  try {
    return await uploadMultipleToCloudinary(files, folder);
  } catch {
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    return files.map((file, idx) => {
      const ext = guessImageExtension(file.mimetype || 'image/jpeg');
      const filename = `product-${Date.now()}-${idx}.${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, file.buffer);
      return {
        url: `${reqMeta.protocol}://${reqMeta.host}/uploads/products/${filename}?v=${Date.now()}`,
        publicId: `local/products/${filename}`,
      };
    });
  }
};

/**
 * Delete an image from Cloudinary by public ID
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete image ${publicId}:`, error);
    // Don't throw — image deletion failures shouldn't block operations
  }
};

/**
 * Delete multiple images from Cloudinary
 */
export const deleteMultipleFromCloudinary = async (
  publicIds: string[]
): Promise<void> => {
  if (publicIds.length === 0) return;
  const deletePromises = publicIds.map((id) => {
    if (id.startsWith('local/products/')) {
      const filename = id.replace('local/products/', '');
      const filePath = path.resolve(process.cwd(), 'uploads', 'products', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return Promise.resolve();
    }
    return deleteFromCloudinary(id);
  });
  await Promise.all(deletePromises);
};
