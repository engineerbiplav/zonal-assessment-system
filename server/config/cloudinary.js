const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generic factory so we can reuse for club logos and contact person photos,
// storing each type in its own Cloudinary folder.
const makeUploader = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `zonal-assessment/${folder}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    },
  });
  return multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
};

// Deletes a previously-uploaded image from Cloudinary and *waits* for the
// result instead of firing-and-forgetting, so callers can know for sure
// whether the old image was actually removed (rather than assuming it was
// just because the destroy() call didn't throw).
// Returns { deleted: boolean, result?: string, error?: string }.
const deleteImage = async (publicId, context = "image") => {
  if (!publicId) return { deleted: false, result: "no-public-id" };
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    // Cloudinary resolves with { result: "ok" } on success, or
    // { result: "not found" } if it was already gone — either way nothing
    // is left behind, but we only call it a confirmed delete on "ok".
    const deleted = response.result === "ok" || response.result === "not found";
    if (deleted) {
      console.log(`[cloudinary] Confirmed old ${context} removed (publicId=${publicId}, result=${response.result})`);
    } else {
      console.warn(`[cloudinary] Could not confirm deletion of old ${context} (publicId=${publicId}, result=${response.result})`);
    }
    return { deleted, result: response.result };
  } catch (err) {
    console.error(`[cloudinary] Error deleting old ${context} (publicId=${publicId}):`, err.message);
    return { deleted: false, error: err.message };
  }
};

module.exports = { cloudinary, makeUploader, deleteImage };
