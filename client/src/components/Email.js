import React from 'react';
import { Container, Typography } from '@mui/material';
import UnverifiedAlert from './UnverifiedAlert';

function Email() {
  return (
    <Container>
      <UnverifiedAlert />
      <Typography variant="h4" sx={{ mt: 4 }}>
        Hello Email page
      </Typography>
    </Container>
  );
}

export default Email;
