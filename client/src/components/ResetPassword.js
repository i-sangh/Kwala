import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
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
            // Navigate to login after showing success message
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setError(error.response?.data?.error || 'Password reset failed');
        }
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
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    Reset Password
                </Typography>

                <Typography sx={{ mt: 2, mb: 4 }}>
                    Enter the reset code sent to {email} and your new password
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
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Reset Password
                    </Button>
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