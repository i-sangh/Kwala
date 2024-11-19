const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Import User model
const User = require('./models/User');

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        // Force immediate cleanup on server start
        await User.cleanupExpiredUsers();
    })
    .catch((err) => console.error('MongoDB connection error:', err));

// Schedule cleanup every minute
setInterval(async () => {
    try {
        const result = await User.cleanupExpiredUsers();
        if (result.deletedCount > 0) {
            console.log(`Cleaned up ${result.deletedCount} expired users`);
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}, 60000); // Run every minute

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
            <p>This code will expire in 3 minutes.</p>
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
            <p>This code will expire in 3 minutes.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader) {
        console.log('No token provided in headers');
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        console.log('Attempting to verify token');
        const decoded = jwt.verify(token, 'your_jwt_secret');
        console.log('Token decoded:', decoded);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
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

        const VERIFICATION_DURATION = 180; // 3 minutes in seconds
        
        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + VERIFICATION_DURATION * 1000);

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 8);
        const user = new User({ 
            name,
            email, 
            phoneNumber,
            password: hashedPassword,
            country,
            verificationCode,
            verificationCodeExpires,
            isNewRegistration: true
        });

        await user.save();
        
        // Send verification email with updated message
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
        user.isNewRegistration = false;  // Mark as not a new registration after verification
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

        // Check if a reset code was recently sent (within last minute)
        if (user.resetPasswordCodeExpires && 
            user.resetPasswordCodeExpires > Date.now() - 60000) {
            return res.status(400).json({ 
                error: 'Please wait before requesting another code'
            });
        }

        const resetCode = generateVerificationCode();
        const resetCodeExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

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

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters long'
            });
        }

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

// Update the resend-verification route
app.post('/api/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const VERIFICATION_DURATION = 180; // 3 minutes in seconds

        const user = await User.findOne({ 
            email,
            isVerified: false
        });

        if (!user) {
            return res.status(400).json({ 
                error: 'User not found or already verified'
            });
        }

        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + VERIFICATION_DURATION * 1000);

        user.verificationCode = verificationCode;
        user.verificationCodeExpires = verificationCodeExpires;
        await user.save();

        await sendVerificationEmail(email, verificationCode);

        res.json({ 
            success: true,
            message: 'New verification code sent'
        });

    } catch (error) {
        res.status(400).json({ 
            error: error.message || 'Failed to resend verification code'
        });
    }
});

// Get verification status
app.get('/api/verification-status/:email', async (req, res) => {
    try {
        const VERIFICATION_DURATION = 180; // 3 minutes in seconds
        const email = decodeURIComponent(req.params.email);
        const user = await User.findOne({ 
            email,
            isVerified: false,
            verificationCode: { $ne: null }
        });

        // Check if user exists and if the verification code has expired
        if (!user || !user.verificationCodeExpires || user.verificationCodeExpires < Date.now()) {
            return res.json({ 
                timeRemaining: 0,
                exactDuration: 0 // Updated to return exactDuration
            });
        }

        const timeRemaining = Math.max(
            0,
            Math.floor((user.verificationCodeExpires - Date.now()) / 1000)
        );

        // Consider it a fresh verification if the code was created within the last 2 seconds
        const isFreshVerification = (user.verificationCodeExpires.getTime() - Date.now()) >= (VERIFICATION_DURATION * 1000 - 2000);

        res.json({ 
            timeRemaining,
            exactDuration: isFreshVerification ? VERIFICATION_DURATION : timeRemaining // Updated to return exactDuration
        });
    } catch (error) {
        res.status(400).json({ 
            error: error.message || 'Failed to fetch verification status'
        });
    }
});

// Get reset password status
app.get('/api/reset-password-status/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const user = await User.findOne({ 
            email,
            resetPasswordCode: { $ne: null }
        });

        if (!user || !user.resetPasswordCodeExpires) {
            return res.json({ timeRemaining: 0 });
        }

        const timeRemaining = Math.max(
            0,
            Math.floor((user.resetPasswordCodeExpires - Date.now()) / 1000)
        );

        res.json({ timeRemaining });
    } catch (error) {
        res.status(400).json({ 
            error: error.message || 'Failed to fetch reset password status'
        });
    }
});

// Chat routes
app.use('/api/chat', require('./routes/chatRoutes'));

// Add this new endpoint for token verification
app.get('/api/verify-token', verifyToken, async (req, res) => {
    try {
        console.log('Finding user with ID:', req.userId);
        const user = await User.findById(req.userId);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User found, sending response');
        res.json({
            success: true,
            user: {
                email: user.email,
                name: user.name,
                phoneNumber: user.phoneNumber,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});