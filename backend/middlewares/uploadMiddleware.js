const multer = require('multer');
const {
  isAllowedImageUpload,
  sanitizeUploadFilename,
  MAX_UPLOAD_BYTES,
} = require('../utils/fileStorage');
const { bannersDir, logosDir } = require('../utils/paths');

function imageFileFilter(req, file, cb) {
  const check = isAllowedImageUpload(file.originalname, file.mimetype);
  if (!check.valid) {
    return cb(new Error(check.error));
  }
  cb(null, true);
}

function createStorage(destDir, prefix) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destDir),
    filename: (req, file, cb) => {
      cb(null, sanitizeUploadFilename(file.originalname, prefix));
    },
  });
}

const uploadBanner = multer({
  storage: createStorage(bannersDir, 'banner'),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: imageFileFilter,
});

const uploadLogo = multer({
  storage: createStorage(logosDir, 'logo'),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: imageFileFilter,
});

const uploadEventImages = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, file.fieldname === 'logo' ? logosDir : bannersDir);
    },
    filename: (req, file, cb) => {
      const prefix = file.fieldname === 'logo' ? 'logo' : 'banner';
      cb(null, sanitizeUploadFilename(file.originalname, prefix));
    },
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: imageFileFilter,
});

module.exports = {
  uploadBanner,
  uploadLogo,
  uploadEventImages,
};
