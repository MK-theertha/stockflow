import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stripesubscriptionId: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    price: { type: Number, default: 600 },
  },
  { timestamps: true }
);

export default mongoose.model('Subscription', SubscriptionSchema);
