import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if (
    ![username, email, fullname, password].every(
      (field) => field && field.trim() !== ""
    )
  ) {
    throw new ApiError(404, "All fields are required !");
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  console.log("Files", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath, "[[[[[");
  const coverImageLocalPath = req.files?.coverImage[0].path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required !");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required !");
  }

  const user = await User.create({
    username,
    email,
    password,
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url,
  });

  const registeredUser = await User.findById(user._id).select(
    "-passwod -refreshToken"
  );
  if (!registeredUser) {
    throw new ApiError(500, "Something went wrong while registering the user!");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, registeredUser, "User Registered Successfully..")
    );
});

export default registerUser;
