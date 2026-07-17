import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

let listenersBound = false;

function bindConnectionListeners(): void {
  if (listenersBound) return;
  listenersBound = true;
  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("error", (err) => logger.error({ err }, "MongoDB connection error"));
}

/** Connect to MongoDB. Rejects if the initial connection fails. */
export async function connectDb(uri: string = env.MONGODB_URI): Promise<void> {
  bindConnectionListeners();
  // Fail fast on the first connection attempt rather than buffering forever.
  mongoose.set("bufferTimeoutMS", 5000);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

/** True when the active connection is usable. */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
