import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minLength: 3, maxLength: 20 },
    username: { type: String, required: true, trim: true, minLength: 3, maxLength: 20 },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    image: { type: String },
    phone: { type: String },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    subscription: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
