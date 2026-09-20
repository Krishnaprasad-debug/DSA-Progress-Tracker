import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-progress-tracker';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[database]: MongoDB connected to host ${conn.connection.host}`);
  } catch (error) {
    console.error('[database]: MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('[database]: MongoDB disconnected');
  } catch (error) {
    console.error('[database]: MongoDB disconnect error:', error);
  }
};
