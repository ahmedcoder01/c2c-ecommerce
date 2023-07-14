import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import validate from '../middlewares/validation.middleware';
import { authValidations } from '../validations';
import { authController } from '../controllers';

const api = Router();

api.get('/create', asyncHandler(authController.create));
api.get('/refresh', validate(authValidations.refresh), asyncHandler(authController.refresh));

export default Router().use('/v1', api);
