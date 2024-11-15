import React from 'react';
import { Alert, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';  // Changed this line

function UnverifiedAlert() {
  const { user } = useAuth();  // Using the useAuth hook instead of useContext

  if (!user || user.isVerified) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Alert 
        severity="warning" 
        sx={{ 
          '& .MuiAlert-message': { 
            width: '100%' 
          }
        }}
      >
        Your account is not email verified and is subjected to deactivation. Please{' '}
        <Link to="/register" style={{ color: 'inherit', fontWeight: 'bold' }}>
          register with new credentials
        </Link>
        {' '}or try{' '}
        <Link to="/forgot-password" style={{ color: 'inherit', fontWeight: 'bold' }}>
          reset the password
        </Link>
        {' '}with forgot password option.
      </Alert>
    </Box>
  );
}

export default UnverifiedAlert;