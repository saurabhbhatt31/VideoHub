import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { set } from "mongoose";

const genereateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens ."
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  if (
    ![username, email, fullname, password].every(
      (field) => field && field.trim() !== ""
    )
  ) {
    throw new ApiError(404, "All fields are required !");
  }

  const existedUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  console.log("Files", req.files);
  let avatarLocalPath = null;

  if (req.files?.avatar != null) {
    avatarLocalPath = req.files?.avatar[0]?.path;
  }
  if (avatarLocalPath === null) {
    throw new ApiError(400, "Avatar is required !");
  }

  let coverImageLocalPath = "";
  let coverImage = "";
  if (req.files?.coverImage != null) {
    coverImageLocalPath = req.files?.coverImage[0].path;
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required !");
  }

  const user = await User.create({
    username,
    email,
    password,
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || null,
  });

  const registeredUser = await User.findById(user._id).select(
    "-password -refreshToken"
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

const login = asyncHandler(async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!(username || email)) {
      throw new ApiError(401, "Username or email is required");
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
      throw new ApiError(404, "User does not exist!");
    }
    if (!password) {
      throw new ApiError(401, "Password is required");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid Credentials");
    }
    const { accessToken, refreshToken } = await genereateAccessAndRefreshToken(
      user._id
    );
    user.refreshToken = refreshToken;
    user.save({ validateBefreSave: false });
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken },
          "User logged in successfully"
        )
      );
  } catch (error) {
    console.error("Error in login:", error);
    throw new ApiError(500, "Something went wrong while login !");
  }
});

const logOutUser = asyncHandler(async (req, res) => {
  try {
    const requestedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { refreshToken: "" } },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    console.log(requestedUser, "[[[");
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User is Logged Out"));
  } catch (error) {
    console.log(error, "Logout error ");
    throw new ApiError(500, "something went wrong ");
  }
});
export { registerUser, login, logOutUser };
