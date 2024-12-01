// client/src/utils/api.js
const getApiUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return 'https://kwalaai.onrender.com';  // Your Render URL
    }
    return 'http://localhost:5000';
};

export const API_URL = getApiUrl();

// Add this for debugging
console.log('Current API_URL:', API_URL);
console.log('Current NODE_ENV:', process.env.NODE_ENV);