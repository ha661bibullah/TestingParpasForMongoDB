// models/PaymentRequest.js
const mongoose = require('mongoose');

const PaymentRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  transactionId: { type: String, required: true },
  paymentMethod: { type: String, required: true, enum: ['bkash', 'nagad', 'bank'] },
  amount: { type: Number, required: true }, // নতুন যোগ করা ফিল্ড
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminComments: { type: String }, // অ্যাডমিন কমেন্টস যোগ করা
  submissionDate: { type: Date, default: Date.now },
  approvalDate: { type: Date }, // কখন অ্যাপ্রুভ করা হলো
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // কোন অ্যাডমিন অ্যাপ্রুভ করলো
});

module.exports = mongoose.model('PaymentRequest', PaymentRequestSchema);