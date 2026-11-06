import mongoose from 'mongoose';

// Every business record belongs to the user (shop) that created it.
export const owner = {
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
};
