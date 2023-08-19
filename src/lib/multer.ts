import fs from 'fs';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const userDir = `uploads/images/${req?.res?.locals?.userId}`;

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },
  filename(req, file, cb) {
    const ext = `.${file.mimetype.split('/')[1]}`;
    cb(null, Date.now() + ext);
  },
});

const multerFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

export const imageUpload = multer({
  storage,
  fileFilter: multerFilter,
});
