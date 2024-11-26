const mongoose = require('mongoose');

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
        lowercase: true,
        index: true
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
    },
    isNewRegistration: {
        type: Boolean,
        default: true
    },
    deleteAt: {
        type: Date,
        expires: 0,
        default: function() {
            if (!this.isVerified && this.isNewRegistration) {
                return new Date(Date.now() + 12 * 60 * 1000);
            }
            return null;
        }
    }
}, { timestamps: true });

// Add pre-save middleware
userSchema.pre('save', function(next) {
    if (this.isVerified) {
        this.deleteAt = null;
    }
    else if (this.isModified('isVerified') && !this.isVerified && this.isNewRegistration) {
        this.deleteAt = new Date(Date.now() + 12 * 60 * 1000);
    }
    next();
});

// Add a method to force cleanup of expired documents
userSchema.statics.cleanupExpiredUsers = async function() {
    const now = new Date();
    return this.deleteMany({
        deleteAt: { $lt: now },
        isVerified: false,
        isNewRegistration: true
    });
};

// Drop existing indexes before creating new ones
const dropIndexes = async () => {
    try {
        await mongoose.connection.collections['users'].dropIndexes();
        console.log('Dropped all indexes');
    } catch (error) {
        console.log('No indexes to drop');
    }
};

// Create the model
const User = mongoose.model('User', userSchema);

// Function to initialize indexes
const initializeIndexes = async () => {
    try {
        // Drop existing indexes
        await dropIndexes();
        
        // Create TTL index
        await User.collection.createIndex(
            { "deleteAt": 1 },
            { expireAfterSeconds: 0 }
        );
        
        // Create email unique index
        await User.collection.createIndex(
            { "email": 1 },
            { unique: true }
        );
        
        console.log('Indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
};

// Export both the model and the initialization function
module.exports = {
    User,
    initializeIndexes
};