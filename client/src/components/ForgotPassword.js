import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

function ForgotPassword() {
    const [email, setEmail] = useState(useLocation().state?.email || '');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Fetch initial timer status from server
    useEffect(() => {
        const fetchResetStatus = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/reset-password-status/${encodeURIComponent(email)}`);
                const { timeRemaining: serverTimeRemaining } = response.data;
                setTimeRemaining(serverTimeRemaining);
            } catch (error) {
                console.error('Error fetching reset password status:', error);
                setTimeRemaining(0);
            }
        };

        // Only fetch the status if the email is not empty
        if (email) {
            fetchResetStatus();
        }
    }, [email]);

    // Handle timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await axios.post('http://localhost:5000/api/forgot-password', { email });
            setShowSuccess(true);
            // Navigate to reset password page after showing success message
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to process request');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        if (seconds === null || seconds <= 0) return '00:00'; // Return '00:00' when timeRemaining is null or 0
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    Forgot Password
                </Typography>

                <Typography sx={{ mt: 2, mb: 4, textAlign: 'center' }}>
                    Enter your email address and we'll send you a code to reset your password.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                                Sending Code...
                            </Box>
                        ) : (
                            'Send Reset Code'
                        )}
                    </Button>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Typography color="primary" align="center">
                            Back to Login
                        </Typography>
                    </Link>
                </Box>

                {timeRemaining !== null && timeRemaining > 0 && (
                    <Typography
                        sx={{
                            mb: 2,
                            color: timeRemaining < 60 ? 'error.main' : 'text.primary',
                            fontWeight: 'bold'
                        }}
                    >
                        Time Remaining: {formatTime(timeRemaining)}
                    </Typography>
                )}
            </Box>

            <Snackbar
                open={showSuccess}
                autoHideDuration={2000}
                onClose={() => setShowSuccess(false)}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    Password reset code sent! Check your email.
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default ForgotPassword;