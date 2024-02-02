import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const uploadVideo = asyncHandler(async (req, res) => {
  console.log("Video upload function ++++++++++++++++++++");
  const video = req.files?.video;
  const thumbnail = req.files?.thumbnail;
  if (video === undefined || video === null) {
    throw new ApiError(403, "video is required");
  }
  if (thumbnail === undefined || thumbnail === null) {
    throw new ApiError(403, "thumbnail is required");
  }
  const { title, description } = req.body;
  if (!(title || description)) {
    throw new ApiError(403, "title and description are required");
  }
  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  const videoLocalPath = req.files.video[0]?.path;
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
  
  if (!uploadedVideo) {
    throw new ApiError(500, "Something went wrong while uploading video");
  }

  const uploadedDetails = await Video.create({
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail.url,
    title,
    description,
    duration: uploadedVideo.duration,
    videoOwner: req.user._id,
  });

  return apiResponse(res, true, 200, uploadedDetails);
});

export { uploadVideo };
