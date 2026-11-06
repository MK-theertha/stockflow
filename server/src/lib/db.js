import mongoose from 'mongoose';

import { config } from '../config.js';

export default async function dbConnect(uri = config.dbUri) {
  await mongoose.connect(uri);
}
