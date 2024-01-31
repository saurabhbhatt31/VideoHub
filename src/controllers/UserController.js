import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse, apiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
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
      return apiResponse(res, false, 401, "username or email is required");
    }
    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
      return apiResponse(res, false, 404, "User does not exist!");
    }
    if (!password) {
      return apiResponse(res, false, 401, "Password is required ");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return apiResponse(res, false, 404, "Invalid Credentials ");
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
    await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { refreshToken: "" } },
      { new: true }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

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

const refreshAcessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      return apiResponse(res, false, 403, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await genereateAccessAndRefreshToken(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    console.log("Error in refreshAccessToken", error);
    // If error is an instance of ApiError, return its status code; otherwise, default to 500
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message =
      error instanceof ApiError ? error.message : "Internal Server Error";
    throw new ApiError(statusCode, message);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { old_password, new_password, confirm_password } = req.body;
  if (!(old_password && new_password && confirm_password)) {
    throw new ApiError(
      401,
      "old_password,new_password and confirm_password are required!"
    );
  }
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(old_password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "olpassword is incorrect");
  }

  if (new_password !== confirm_password) {
    throw new ApiError(403, "New password and confirm password are not same");
  }

  user.password = new_password;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Updated Succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    " -password -refreshToken -coverImage -watchHistory"
  );
  if (!user) {
    throw new ApiError(404, "Invalid request");
  }
  return res.status(200).json(new ApiResponse(200, user, "Current user"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    if (req.files?.avatar == undefined) {
      throw new ApiError(401, "avatar image is required");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
      throw new ApiError(500, "Error while updating avatar");
    }
    const user = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $set: { avatar: avatar.url },
      },
      { new: true }
    ).select("-password");
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar updated successfully"));
  } catch (error) {
    console.log("Error in updating user avatar", error);
    throw new ApiError(500, "Error in updating user avatar");
  }
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    if (req.files?.coverImage == undefined) {
      throw new ApiError(401, "cover image is required");
    }
    const converImageLocaPath = req.files?.avatar[0]?.path;
    const converimage = await uploadOnCloudinary(converImageLocaPath);
    if (!converimage.url) {
      throw new ApiError(500, "Error while updating cover image");
    }
    const user = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $set: { converimage: converimage.url },
      },
      { new: true }
    ).select("-password");
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover Image updated successfully"));
  } catch (error) {
    console.log("Error in updating user cover image", error);
    throw new ApiError(500, "Error in updating  cover image");
  }
});

export {
  registerUser,
  login,
  logOutUser,
  refreshAcessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
};
