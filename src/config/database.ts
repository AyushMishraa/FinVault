import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  console.log("Connecting to MongoDB…", { uri: uri });
  if (!uri)
    throw new Error("MONGODB_URI is not defined in environment variables");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected — host: ${mongoose.connection.host}`);

  mongoose.connection.on("disconnected", () =>
    console.warn("MongoDB disconnected"),
  );
  mongoose.connection.on("error", (err: Error) =>
    console.error("MongoDB error:", err.message),
  );
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log("MongoDB disconnected gracefully");
}
