import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { requireAuth, requireSellerProfile } from '../../middlewares/auth.middleware';
import { anyFileUpload } from '../../lib/multer';
import { uploadController } from '../../controllers';

const uploadRoute = Router();

// uploadRoute.post(
//   '/upload',
//   requireAuth,
//   requireSellerProfile,
//   anyFileUpload.single('file'),
//   asyncHandler(uploadController.upload),
// );

export default uploadRoute;
