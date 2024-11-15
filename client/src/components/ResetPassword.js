import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    Snackbar
} from '@mui/material';
import axios from 'axios';

function ResetPassword() {
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    // Fetch initial timer status from server
    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
            return;
        }

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

        fetchResetStatus();

        // Check if the user came from the ForgotPassword page
        if (location.state?.email === email) {
            // Reset the timer
            setTimeRemaining(180); // Set to 3 minutes
        }
    }, [email, navigate, location.state]);

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

        if (timeRemaining === 0) {
            // Redirect user back to forgot password page with a new timer
            navigate('/forgot-password', { state: { email } });
            return;
        }

        // Validate password fields
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/reset-password', {
                email,
                code: resetCode,
                newPassword
            });

            setShowSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.error || 'Password reset failed');
        }
    };

    const formatTime = (seconds) => {
        if (seconds === null) return '...';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!email) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 8 }}>
                    <Alert severity="error">
                        Invalid reset password request. Please try again from the forgot password page.
                    </Alert>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Box sx={{ 
                mt: 8, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center' 
            }}>
                <Typography component="h1" variant="h5">
                    Reset Password
                </Typography>

                <Typography sx={{ mt: 2, mb: 4 }}>
                    Enter the reset code sent to {email} and your new password
                </Typography>

                <Typography
                    sx={{
                        mb: 2,
                        color: timeRemaining < 60 ? 'error.main' : 'text.primary',
                        fontWeight: 'bold'
                    }}
                >
                    Time Remaining: {formatTime(timeRemaining)}
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
                        label="Reset Code"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        disabled={timeRemaining === 0}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={timeRemaining === 0}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={timeRemaining === 0}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={timeRemaining === 0}
                    >
                        Reset Password
                    </Button>

                    {timeRemaining === 0 && (
                        <Link
                            to="/forgot-password"
                            state={{ email }}
                            style={{
                                textDecoration: 'none',
                                display: 'block',
                                textAlign: 'center'
                            }}
                        >
                            <Typography color="primary">
                                Back to Forgot Password
                            </Typography>
                        </Link>
                    )}
                </Box>
            </Box>

            <Snackbar
                open={showSuccess}
                autoHideDuration={2000}
                onClose={() => setShowSuccess(false)}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    Password reset successful! Redirecting to login...
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default ResetPassword;