import fs from 'fs';
import multer from 'multer';
import path from 'path';
import httpStatus from 'http-status';
import HttpException from '../utils/http-exception';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (!file) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Please upload a file');
    }
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
    cb(
      new HttpException(httpStatus.BAD_REQUEST, 'Not an image! Please upload only images.'),
      false,
    );
  }
};

export const imageUpload = multer({
  storage,
  fileFilter: multerFilter,
});
