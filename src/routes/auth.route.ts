import asyncHandler  from 'express-async-handler';
import { Router } from "express";
import validate from "../middlewares/validation.middleware";
import { authValidations } from "../validations";
import { authController } from '../controllers';

const authRouter = Router();

authRouter.post("/signup", validate(authValidations.signup), asyncHandler(authController.signup));
authRouter.post("/login", validate(authValidations.login), asyncHandler(authController.login));
authRouter.get("/refresh", validate(authValidations.refresh), asyncHandler(authController.refresh));
authRouter.get("/me", validate(authValidations.me), asyncHandler(authController.me));
authRouter.get("/logout", asyncHandler(authController.logout));

export default authRouter