const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{7,11}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    country: {
        name: {
            type: String,
            required: [true, 'Country name is required'],
            trim: true
        },
        phoneCode: {
            type: String,
            required: [true, 'Country phone code is required'],
            trim: true
        }
    },
    password: { 
        type: String, 
        required: [true, 'Password is required']
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null
    },
    verificationCodeExpires: {
        type: Date,
        default: null
    },
    resetPasswordCode: {
        type: String,
        default: null
    },
    resetPasswordCodeExpires: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generate verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        html: `
            <h1>Email Verification</h1>
            <p>Your verification code is: <strong>${code}</strong></p>
            <p>This code will expire in 10 minutes.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Send reset password email
const sendResetPasswordEmail = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Password',
        html: `
            <h1>Reset Password</h1>
            <p>Your password reset code is: <strong>${code}</strong></p>
            <p>This code will expire in 10 minutes.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Registration Route
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phoneNumber, password, country } = req.body;

        // Validate phone number
        if (!/^\d{7,11}$/.test(phoneNumber)) {
            return res.status(400).json({
                error: 'Invalid phone number format'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                error: 'Email already registered'
            });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 8);
        const user = new User({ 
            name,
            email, 
            phoneNumber,
            password: hashedPassword,
            country,
            verificationCode,
            verificationCodeExpires
        });

        await user.save();
        
        // Send verification email
        await sendVerificationEmail(email, verificationCode);

        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
        
        res.status(201).json({ 
            success: true,
            user: { 
                email: user.email,
                name: user.name,
                phoneNumber: user.phoneNumber,
                isVerified: user.isVerified
            },
            token 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ 
            error: error.message || 'Registration failed'
        });
    }
});

// Verify Email Route
app.post('/api/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ 
            email,
            verificationCode: code,
            verificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                error: 'Invalid or expired verification code'
            });
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save();

        res.json({ 
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        res.status(400).json({ 
            error: error.message || 'Verification failed'
        });
    }
});

// Forgot Password Route
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                error: 'User not found'
            });
        }

        const resetCode = generateVerificationCode();
        const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetPasswordCode = resetCode;
        user.resetPasswordCodeExpires = resetCodeExpires;
        await user.save();

        await sendResetPasswordEmail(email, resetCode);

        res.json({ 
            success: true,
            message: 'Password reset code sent to email'
        });

    } catch (error) {
        res.status(400).json({ 
            error: error.message || 'Failed to send reset code'
        });
    }
});

// Reset Password Route
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        const user = await User.findOne({ 
            email,
            resetPasswordCode: code,
            resetPasswordCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                error: 'Invalid or expired reset code'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 8);
        user.password = hashedPassword;
        user.resetPasswordCode = null;
        user.resetPasswordCodeExpires = null;
        await user.save();

        res.json({ 
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        res.status(400).json({ 
            error: error.message || 'Password reset failed'
        });
    }
});

// Login Route (unchanged)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                error: 'User not found'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                error: 'Invalid password'
            });
        }

        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret');
        res.json({ 
            success: true,
            user: { 
                email: user.email,
                name: user.name,
                phoneNumber: user.phoneNumber,
                isVerified: user.isVerified
            },
            token 
        });

    } catch (error) {
        res.status(400).json({ 
            error: error.message || 'Login failed'
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});