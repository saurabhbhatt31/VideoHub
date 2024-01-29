import registerUser from "../controllers/UserController";
import { upload } from "../middlewares/multer.middleware";
import { Router } from "express";

const router = Router();

router.route("register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
