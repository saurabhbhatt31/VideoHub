import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);


app.use("/user", userRoutes);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
export default app;
