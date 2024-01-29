import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";

cloudinary.config({
  cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`,
  api_key: `${process.env.CLOUDINARY_API_KEY}`,
  api_secret: `${process.env.CLOUDINARY_API_SECRET}`,
});

const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;
    // upload the file on cloudinary
    const uploadeResponse = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    console.log("File is uploaded on cloudinary");
    console.log("Uploaded Response", uploadeResponse.url);
    return response;
  } catch (error) {
    // remove the locally saved file as the upload operation got failed
    fs.unlinkSync(localfilepath);
  }
};

export { uploadOnCloudinary };
