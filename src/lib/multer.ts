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
    // const dir = `uploads/files/${req?.res?.locals?.userId}`;

    const dir = `uploads/files`;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = `.${file.mimetype.split('/')[1]}`;
    cb(null, Date.now() + ext);
  },
});

const multerFilter = (req: any, file: any, cb: any) => {
  if (!file) {
    cb(new HttpException(httpStatus.BAD_REQUEST, 'Please upload a file'), false);
  }

  if (
    file.mimetype.startsWith('image') ||
    file.mimetype.startsWith('video') ||
    file.mimetype.startsWith('application')
  ) {
    cb(null, true);
  } else {
    cb(new HttpException(httpStatus.BAD_REQUEST, 'Please upload an image or video'), false);
  }
};

export const anyFileUpload = multer({
  storage,
  fileFilter: multerFilter,
});
