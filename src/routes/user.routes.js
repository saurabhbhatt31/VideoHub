import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  registerUser,
  login,
  logOutUser,
  refreshAcessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
} from "../controllers/UserController.js";

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

userRouter
  .route("/change-current-password")
  .post(verifyJWT, changeCurrentPassword);

userRouter.route("/refresh-access-token").post(refreshAcessToken);

userRouter.route("/get-current-user").get(verifyJWT, getCurrentUser);

userRouter
  .route("/update-user-avatar")
  .post(
    verifyJWT,
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    updateUserAvatar
  );

userRouter
  .route("/update-cover-image")
  .post(
    verifyJWT,
    upload.fields([{ name: "cover_image", maxCount: 1 }]),
    updateUserCoverImage
  );

userRouter.route("/get-channel-profile").get(verifyJWT, getUserChannelProfile);
export default userRouter;
