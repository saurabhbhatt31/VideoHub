import dotenv from "dotenv";
import connectDB from "./db/dbConnect.js";
import app from "./app.js";
dotenv.config();
const port = process.env.PORT || 5000;
dotenv.config({ path: ".env" });

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on PORT : ${port}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection Failed : ", error);
  });
