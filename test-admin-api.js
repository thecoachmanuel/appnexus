import mongoose from 'mongoose';
import { User } from './src/lib/models/User.js';
import { AppBuild } from './src/lib/models/AppBuild.js';
import connectToDatabase from './src/lib/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    await connectToDatabase();
    const users = await User.find({});
    console.log("Users:", users.length);
    const builds = await AppBuild.countDocuments();
    console.log("Builds:", builds);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
