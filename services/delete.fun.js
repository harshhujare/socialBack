const fs = require("fs");
const cloudinary = require("cloudinary").v2;

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// universal delete
async function deleteImage(imagePath) {
  try {
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      // Cloudinary image
      const parts = imagePath.split("/");
      const filename = parts.pop().split(".")[0]; // e.g. "myimage"
      const folder = parts.slice(parts.indexOf("upload") + 1).join("/"); // e.g. "blogimg"
      const publicId = folder ? `${folder}/${filename}` : filename;

      await cloudinary.uploader.destroy(publicId);
      console.log("✅ Deleted from Cloudinary:", publicId);
    } else {
      // Local image
      await fs.promises.unlink(imagePath);
      console.log("✅ Deleted local image:", imagePath);
    }
  } catch (err) {
    console.error("❌ Failed to delete image:", err.message);
  }
}

module.exports = { deleteImage };