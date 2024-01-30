import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";

cloudinary.config({
  cloud_name: "dnja7dihl",
  api_key: "819879318628763",
  api_secret: "w9sG_1kEIfkTu7_IR3op1VbGf6w",
});

const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;
    const uploadeResponse = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });

    return uploadeResponse;
  } catch (error) {
    // remove the locally saved file as the upload operation got failed
    fs.unlinkSync(localfilepath);
    console.log("Error in uploading on cloudnry", error);
  } finally {
    fs.unlinkSync(localfilepath);
  }
};

export { uploadOnCloudinary };
