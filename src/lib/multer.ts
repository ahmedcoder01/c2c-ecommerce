import multer from 'multer';

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
});
const multerFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

export const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
