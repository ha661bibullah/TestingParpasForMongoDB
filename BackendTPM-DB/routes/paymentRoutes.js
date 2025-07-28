// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const PaymentRequest = require('../models/PaymentRequest');
const authMiddleware = require('../middleware/auth');

// ইউজার পেমেন্ট সাবমিট করবে
router.post('/submit-payment', async (req, res) => {
  try {
    const { name, email, mobile, transactionId, paymentMethod } = req.body;
    
    const paymentRequest = new PaymentRequest({
      name,
      email,
      mobile,
      transactionId,
      paymentMethod,
      amount: 500, // উদাহরণ হিসেবে ফিক্সড অ্যামাউন্ট
      status: 'pending'
    });

    await paymentRequest.save();

    res.status(201).json({ 
      success: true,
      message: 'Payment request submitted successfully',
      data: paymentRequest
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// অ্যাডমিন সব পেমেন্ট রিকোয়েস্ট দেখবে
router.get('/payment-requests', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const requests = await PaymentRequest.find().sort({ submissionDate: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// অ্যাডমিন রিকোয়েস্ট অ্যাপ্রুভ/রিজেক্ট করবে
router.put('/payment-requests/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status, comments } = req.body;
    const request = await PaymentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    request.adminComments = comments;
    request.approvalDate = new Date();
    request.approvedBy = req.user._id;

    await request.save();

    // যদি অ্যাপ্রুভ হয়, তাহলে ইউজারকে এক্সেস দিতে হবে
    if (status === 'approved') {
      await grantUserAccess(request.email); // এই ফাংশনটি আপনি ইমপ্লিমেন্ট করবেন
    }

    res.json({ 
      success: true, 
      message: `Request ${status} successfully`,
      data: request 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ইউজার তার স্ট্যাটাস চেক করতে পারবে
router.get('/check-status/:transactionId', async (req, res) => {
  try {
    const request = await PaymentRequest.findOne({ 
      transactionId: req.params.transactionId 
    });

    if (!request) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ 
      success: true, 
      data: {
        status: request.status,
        comments: request.adminComments,
        approvalDate: request.approvalDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

async function grantUserAccess(email) {
  // এখানে আপনি ইউজারকে এক্সেস দেবেন
  // যেমন: ইউজার মডেল আপডেট করা, প্রিমিয়াম ফিচার এক্টিভেট করা ইত্যাদি
  console.log(`Granting access to user: ${email}`);
  // আপনার লজিক ইমপ্লিমেন্ট করুন
}

module.exports = router;