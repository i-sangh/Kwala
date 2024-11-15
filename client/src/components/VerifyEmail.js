import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

function VerifyEmail() {
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [serverTimeRemaining, setServerTimeRemaining] = useState(null);
    const [displayTime, setDisplayTime] = useState(180);
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState('');
    const [lastFetchTime, setLastFetchTime] = useState(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    // Fetch timer status from server
    const fetchTimerStatus = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/verification-status/${encodeURIComponent(email)}`);
            const { timeRemaining, serverTime } = response.data;
            
            // On initial load, use exactDuration if available
            if (isInitialLoad && serverTime) {
                setDisplayTime(serverTime);
                setServerTimeRemaining(serverTime);
                setIsInitialLoad(false);
            } else {
                setServerTimeRemaining(timeRemaining);
                setDisplayTime(timeRemaining);
            }
            
            setLastFetchTime(Date.now());
        } catch (error) {
            console.error('Error fetching verification status:', error);
            setServerTimeRemaining(0);
            setDisplayTime(0);
        }
    };

    // Initial fetch of timer status
    useEffect(() => {
        if (!email) {
            navigate('/register');
            return;
        }

        fetchTimerStatus();
    }, [email, navigate]);

    // Handle visual timer countdown
    useEffect(() => {
        if (displayTime === null || displayTime <= 0) return;

        const timer = setInterval(() => {
            setDisplayTime(prev => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [displayTime]);

    // Sync with server periodically
    useEffect(() => {
        if (serverTimeRemaining === null || serverTimeRemaining <= 0) return;

        const syncInterval = setInterval(() => {
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - lastFetchTime) / 1000);
            const expectedRemaining = Math.max(0, serverTimeRemaining - elapsedSeconds);

            // If there's a significant difference (more than 2 seconds),
            // refetch from server to ensure accuracy
            if (Math.abs(expectedRemaining - displayTime) > 2) {
                fetchTimerStatus();
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(syncInterval);
    }, [serverTimeRemaining, lastFetchTime, displayTime]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (displayTime === 0) {
            setError('Verification code has expired. Please request a new one.');
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/verify-email', {
                email,
                code: verificationCode
            });
            navigate('/login');
        } catch (error) {
            setError(error.response?.data?.error || 'Verification failed');
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        setError('');
        setResendSuccess('');
        
        try {
            await axios.post('http://localhost:5000/api/resend-verification', { email });
            await fetchTimerStatus(); // Fetch new timer immediately
            setResendSuccess('New verification code sent! Check your email.');
            setVerificationCode('');
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to resend verification code');
        } finally {
            setIsResending(false);
        }
    };

    const formatTime = (seconds) => {
        if (seconds === null || seconds <= 0) return '00:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!email) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ mt: 8 }}>
                    <Alert severity="error">
                        Invalid verification request. Please register first.
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
                    Verify Your Email
                </Typography>

                <Typography sx={{ mt: 2, mb: 2 }}>
                    Please enter the verification code sent to {email}
                </Typography>

                <Typography 
                    sx={{ 
                        mb: 2, 
                        color: displayTime < 60 ? 'error.main' : 'text.primary',
                        fontWeight: 'bold'
                    }}
                >
                    Time Remaining: {formatTime(displayTime)}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                        {error}
                    </Alert>
                )}

                {resendSuccess && (
                    <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
                        {resendSuccess}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Verification Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        disabled={displayTime === 0}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={displayTime === 0}
                    >
                        Verify Email
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleResendCode}
                        disabled={isResending || displayTime > 0}
                        sx={{ mb: 2 }}
                    >
                        {isResending ? (
                            <CircularProgress size={24} />
                        ) : (
                            'Resend Verification Code'
                        )}
                    </Button>

                    {displayTime === 0 && (
                        <Link 
                            to="/register" 
                            style={{ 
                                textDecoration: 'none',
                                display: 'block',
                                textAlign: 'center'
                            }}
                        >
                            <Typography color="primary">
                                Back to Registration
                            </Typography>
                        </Link>
                    )}
                </Box>
            </Box>
        </Container>
    );
}

export default VerifyEmail;