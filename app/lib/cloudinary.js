// lib/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {File} file - File to upload
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadToCloudinary(file, folder = "portfolio") {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: folder,
          resource_type: "auto",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" }, // Optimize size
            { quality: "auto" }, // Auto quality
            { fetch_format: "auto" }, // Auto format (WebP when supported)
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
        }
      )
      .end(buffer);
  });
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
}

/**
 * Extract public ID from Cloudinary URL
 * Example: https://res.cloudinary.com/demo/image/upload/v1234/folder/image.jpg
 * Returns: folder/image
 */
export function getPublicIdFromUrl(url) {
  if (!url) return null;

  // Match Cloudinary URL pattern
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
}

export default cloudinary;
