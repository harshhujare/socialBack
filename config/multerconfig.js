const multer =require('multer')
const path =require('path')
const crypto =require('crypto')
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const baseUploadsDir = process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR)
        : path.join(process.cwd(), 'public', 'uploads');
      let dest = baseUploadsDir;
      if (file.fieldname === 'image') {
        dest = path.join(baseUploadsDir, 'profile');
      }
      if (file.fieldname === 'blogimg') {
        dest = path.join(baseUploadsDir, 'blogimg');
      }
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest)
    },
    filename: function (req, file, cb) {

        crypto.randomBytes(12,function(err,name){
          if (err) return cb(err);
        const fn=name.toString("hex")+path.extname(file.originalname);
        cb(null, fn)
        })
      
    }
  });

  // Add file filter to allow only image files
  const fileFilter = (req, file, cb) => {
    // Check if the file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };

  const upload=multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });
  module.exports={upload};