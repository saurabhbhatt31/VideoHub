import {
  registerUser,
  login,
  logOutUser,
} from "../controllers/UserController.js";
import { upload } from "../middlewares/multer.middleware.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
userRouter.route("/login").post(login);
userRouter.route("/logout").post(verifyJWT, logOutUser);

export default userRouter;
