import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoute from "./routes/user.route.js";
import gigRoute from "./routes/gig.route.js";
import applicationRoute from "./routes/application.route.js";
import authRoute from "./routes/auth.route.js";
import aiRoute from "./routes/ai.route.js";
import chatRoute from "./routes/chat.route.js";
import notificationRoute from "./routes/notification.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
dotenv.config();
mongoose.set("strictQuery", true);
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("database connected");
  } catch (error) {
    console.log(error);
  }
};
//middleware
//frontend port number
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth/", authRoute);
app.use("/api/users", userRoute);
app.use("/api/gigs", gigRoute);
app.use("/api/applications", applicationRoute);
app.use("/api/ai", aiRoute);
app.use("/api/chat", chatRoute);
app.use("/api/notifications", notificationRoute);

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong";

  return res.status(errorStatus).send(errorMessage);
});
//backend port number
app.listen(8000, () => {
  connect();
  console.log("localserver running");
});
