import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderStatus: { type: String, default: 'Completed' },
    paymentMethod: { type: String, default: 'Credit Card' },
    paymentStatus: { type: String, default: 'Paid' },
    // Stripe checkout session id; unique so a payment can only be redeemed once.
    transactionId: { type: String, required: true, unique: true },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Order', OrderSchema);
