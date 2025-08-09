// lib/cloudinary.ts - Fixed version
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw';
  use_filename?: boolean;
  unique_filename?: boolean;
  filename_override?: string;
}

export async function uploadToCloudinary(
  buffer: Buffer, 
  options: UploadOptions = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: options.folder || 'uploads',
      resource_type: options.resource_type || 'auto',
      use_filename: options.use_filename ?? true,
      unique_filename: options.unique_filename ?? true,
    };

    // Add filename override if provided
    if (options.filename_override) {
      uploadOptions.public_id = `${options.folder}/${options.filename_override}`;
    }

    // Use upload_stream for buffer uploads
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Write the buffer to the stream
    uploadStream.end(buffer);
  });
}

// Alternative method for File objects (if you prefer this approach)
export async function uploadFileToCloudinary(
  file: File,
  folder: string = 'uploads'
): Promise<any> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Determine resource type
  let resourceType: 'image' | 'video' | 'raw' = 'raw';
  if (file.type.startsWith('image/')) {
    resourceType = 'image';
  } else if (file.type.startsWith('video/')) {
    resourceType = 'video';
  }

  return uploadToCloudinary(buffer, {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    filename_override: file.name.replace(/\.[^/.]+$/, "")
  });
}

export function getFileType(mimeType: string, extension?: string): 'image' | 'video' | 'audio' | 'document' {
  // Check MIME type first
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  // Check by extension if MIME type is generic
  if (extension) {
    const ext = extension.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
      return 'image';
    }
    
    if (['mp4', 'avi', 'mov', 'wmv', 'webm', 'flv', 'mkv', 'qt'].includes(ext)) {
      return 'video';
    }
    
    if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)) {
      return 'audio';
    }
  }
  
  return 'document';
}

export async function deleteFromCloudinary(publicId: string): Promise<any> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

export default cloudinary;