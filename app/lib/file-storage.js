// app/lib/file-storage.js
import fs from "fs/promises"; // Node.js built-in module for file system operations
import path from "path"; // Node.js built-in module for path manipulation
import { v4 as uuidv4 } from "uuid"; // For unique file names: npm install uuid

// Define the directory where files will be stored.
// This should be within the 'public' directory of your Next.js project
// so that the files can be served statically by Next.js.
const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "portfolio-images"
);

/**
 * Ensures the upload directory exists.
 */
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Error ensuring upload directory exists:", error);
    throw error;
  }
}

/**
 * Uploads a file to local storage.
 * @param {object} file - The file object (expected to have `filepath`, `originalFilename`, `mimetype`).
 * `filepath` should point to a temporary file on disk.
 * @returns {Promise<string|null>} The URL of the uploaded file, or null if upload fails.
 */
export async function uploadFile(file) {
  if (!file || !file.filepath || !file.originalFilename) {
    console.error("Invalid file object provided for upload.");
    return null;
  }

  await ensureUploadDir(); // Make sure the directory exists

  const fileExtension = path.extname(file.originalFilename);
  const uniqueFileName = `${uuidv4()}${fileExtension}`;
  const destinationPath = path.join(UPLOAD_DIR, uniqueFileName);

  try {
    // Read the temporary file provided by the caller
    const fileBuffer = await fs.readFile(file.filepath);
    // Write the file to its final destination in your public directory
    await fs.writeFile(destinationPath, fileBuffer);

    // The URL will be relative to your public directory
    const fileUrl = `/uploads/portfolio-images/${uniqueFileName}`;

    return fileUrl;
  } catch (error) {
    console.error(
      `Error uploading file ${file.originalFilename} to local storage:`,
      error
    );
    return null;
  }
  // --- REMOVED THE FINALLY BLOCK HERE ---
  // The caller (e.g., the POST route) is now responsible for deleting the temporary file.
}

/**
 * Deletes files from local storage.
 * @param {string[]} urls - An array of file URLs to delete (e.g., '/uploads/portfolio-images/uuid.jpg').
 * @returns {Promise<void>}
 */
export async function deleteFiles(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return;
  }

  for (const url of urls) {
    try {
      // Convert the URL back to a local file path
      // Remove leading '/' and join with process.cwd() / public
      const relativePath = url.startsWith("/") ? url.substring(1) : url; // Remove leading slash
      const filePath = path.join(process.cwd(), "public", relativePath);

      await fs.unlink(filePath); // Delete the file
      console.log(`Successfully deleted local file: ${filePath}`);
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(`File not found for deletion (already removed?): ${url}`);
      } else {
        console.error(`Error deleting local file ${url}:`, error);
      }
      // Do not re-throw if a single file deletion fails, try to delete others
    }
  }
}
