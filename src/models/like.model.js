import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        message: {
            type: String,
            require: true,
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video",
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet", //we've to add tweet model first
        },
    },
    { timestamps: true }
);

export const Like = mongoose.model("like", likeSchema);
