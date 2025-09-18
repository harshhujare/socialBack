// const multer =require('multer')
// const path =require('path')
// const crypto =require('crypto')
// const fs = require('fs');

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       const baseUploadsDir = process.env.UPLOAD_DIR
//         ? path.resolve(process.env.UPLOAD_DIR)
//         : path.join(process.cwd(), 'public', 'uploads');
//       let dest = baseUploadsDir;
//       if (file.fieldname === 'image') {
//         dest = path.join(baseUploadsDir, 'profile');
//       }
//       if (file.fieldname === 'blogimg') {
//         dest = path.join(baseUploadsDir, 'blogimg');
//       }
//       fs.mkdirSync(dest, { recursive: true });
//       cb(null, dest)
//     },
//     filename: function (req, file, cb) {

//         crypto.randomBytes(12,function(err,name){
//           if (err) return cb(err);
//         const fn=name.toString("hex")+path.extname(file.originalname);
//         cb(null, fn)
//         })
      
//     }
//   });

//   // Add file filter to allow only image files
//   const fileFilter = (req, file, cb) => {
//     // Check if the file is an image
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   };

//   const upload=multer({
//     storage: storage,
//     fileFilter: fileFilter,
//     limits: {
//       fileSize: 5 * 1024 * 1024 // 5MB limit
//     }
//   });
//   module.exports={upload};

const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ---- Local storage (for development) ----
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const baseUploadsDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR)
      : path.join(process.cwd(), "public", "uploads");

    let dest = baseUploadsDir;
    if (file.fieldname === "image") {
      dest = path.join(baseUploadsDir, "profile");
    }
    if (file.fieldname === "blogimg") {
      dest = path.join(baseUploadsDir, "blogimg");
    }
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, function (err, name) {
      if (err) return cb(err);
      const fn = name.toString("hex") + path.extname(file.originalname);
      cb(null, fn);
    });
  },
});

// ---- Cloudinary storage (for production) ----
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "uploads";
    if (file.fieldname === "image") folder = "profile";
    if (file.fieldname === "blogimg") folder = "blogimg";

    return {
      folder: folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

// ---- Choose storage based on NODE_ENV ----
const storage = process.env.NODE_ENV === "production" ? cloudStorage : localStorage;

// ---- File filter (images only) ----
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// ---- Multer instance ----
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * Helper function to generate consistent image URLs across environments
 * @param {Object} req - Express request object
 * @param {Object} file - Uploaded file object from multer
 * @param {String} type - Type of upload (profile, blogimg)
 * @returns {String} Complete URL to the uploaded file
 */
const getFileUrl = (req, file, type = 'blogimg') => {
  let fileUrl;
  
  if (process.env.NODE_ENV === "production") {
    // In production, use Cloudinary's secure_url directly
    fileUrl = file.path; // Cloudinary returns the full URL in file.path
  } else {
    // In development, construct the URL using request properties
    const folder = type === 'image' ? 'profile' : 'blogimg';
    fileUrl = `${req.protocol}://${req.get("host")}/uploads/${folder}/${file.filename}`;
  }
  
  return fileUrl;
};

module.exports = { upload, getFileUrl };
