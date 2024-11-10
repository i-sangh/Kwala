import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Alert
} from '@mui/material';
import axios from 'axios';

function VerifyEmail() {
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const handleSubmit = async (e) => {
        e.preventDefault();
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

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    Verify Your Email
                </Typography>
                
                <Typography sx={{ mt: 2, mb: 4 }}>
                    Please enter the verification code sent to {email}
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
                        label="Verification Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Verify Email
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default VerifyEmail;