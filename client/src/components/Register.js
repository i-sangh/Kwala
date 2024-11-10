import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    TextField, 
    Button, 
    Container, 
    Typography, 
    Box, 
    Alert,
    Snackbar 
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Make sure all fields are filled
            if (!name.trim() || !email.trim() || !phoneNumber.trim() || !password.trim()) {
                setError('All fields are required');
                return;
            }

            await register(name, email, phoneNumber, password);
            setShowSuccess(true);
            navigate('/verify-email', { state: { email } });
        } catch (error) {
            setError(error.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    Register
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
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign Up
                    </Button>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Typography color="primary" align="center">
                            Already have an account? Sign In
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
                    Registration successful! Please verify your email.
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default Register;