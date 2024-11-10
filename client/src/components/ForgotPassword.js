import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await axios.post('http://localhost:5000/api/forgot-password', { email });
            setShowSuccess(true);
            // Navigate to reset password page after showing success message
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to process request');
        }
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
                    >
                        Send Reset Code
                    </Button>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Typography color="primary" align="center">
                            Back to Login
                        </Typography>
                    </Link>
                </Box>
            </Box>

            <Snackbar
                open={showSuccess}
                autoHideDuration={2000}
                onClose={() => setShowSuccess(false)}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    Reset code sent! Check your email.
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default ForgotPassword;