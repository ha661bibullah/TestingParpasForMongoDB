require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios'); // ✅ এই লাইব্রেরি HTTP রিকোয়েস্ট পাঠাতে দরকার

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paymentDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    transactionId: { type: String, required: true },
    paymentMethod: { type: String, required: true, enum: ['bkash', 'nagad', 'bank'] },
    submissionDate: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

// ✅ Webhook URL (তুমি .env ফাইলে রাখতে পারো)
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://example.com/webhook';

// API Route
app.post('/api/submit-payment', async (req, res) => {
    try {
        const { name, email, mobile, transactionId, paymentMethod } = req.body;

        // Validation
        if (!name || !email || !mobile || !transactionId || !paymentMethod) {
            return res.status(400).json({ message: 'সমস্ত তথ্য প্রদান করুন' });
        }

        if (!/^01[3-9]\d{8}$/.test(mobile)) {
            return res.status(400).json({ message: 'সঠিক মোবাইল নম্বর দিন' });
        }

        const existingTransaction = await Payment.findOne({ transactionId });
        if (existingTransaction) {
            return res.status(400).json({ message: 'এই ট্রানজেকশন আইডি আগেই ব্যবহার করা হয়েছে' });
        }

        const newPayment = new Payment({
            name,
            email,
            mobile,
            transactionId,
            paymentMethod
        });

        await newPayment.save();

        // ✅ Webhook এ POST রিকোয়েস্ট পাঠাও
        try {
            await axios.post(WEBHOOK_URL, {
                name,
                email,
                mobile,
                transactionId,
                paymentMethod,
                submittedAt: newPayment.submissionDate
            });
            console.log('✅ Webhook request sent successfully');
        } catch (webhookError) {
            console.error('❌ Webhook request failed:', webhookError.message);
        }

        res.status(201).json({ 
            message: 'পেমেন্ট তথ্য সফলভাবে সংরক্ষণ করা হয়েছে',
            data: newPayment
        });

    } catch (error) {
        console.error('Error saving payment:', error);
        res.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
