import registerUser from "../controllers/UserController.js";
import {upload} from "../middlewares/multer.middleware.js"
import { Router } from "express";

const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

export default userRouter;
