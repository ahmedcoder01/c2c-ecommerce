import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import validate from '../middlewares/validation.middleware';
import { authValidations } from '../validations';
import { authController } from '../controllers';
import { ENDPOINTS } from '../endpoints';

const api = Router();

api.get(ENDPOINTS.auth.signup, validate(authValidations.signup), asyncHandler(authController.signup));
api.get(ENDPOINTS.auth.login, validate(authValidations.login), asyncHandler(authController.login));
api.get(ENDPOINTS.auth.refresh, validate(authValidations.refresh), asyncHandler(authController.refresh));

export default Router().use('/v1', api);
