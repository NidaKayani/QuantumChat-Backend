import mongoose from 'mongoose';

// Serverless platforms (Vercel) reuse warm containers across invocations and
// call this on every request — cache the connection promise so we don't
// reconnect (or race concurrent connects) each time.
let connectionPromise;

export function connectDB() {
  if (!connectionPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not set');
    }
    connectionPromise = mongoose
      .connect(uri)
      .then(() => console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`))
      .catch((err) => {
        connectionPromise = undefined; // allow retry on next invocation
        throw err;
      });
  }
  return connectionPromise;
}
