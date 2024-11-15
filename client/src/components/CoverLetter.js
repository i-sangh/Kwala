import React from 'react';
import { Container, Typography } from '@mui/material';
import UnverifiedAlert from './UnverifiedAlert';

function CoverLetter() {
  return (
    <Container>
      <UnverifiedAlert />
      <Typography variant="h4" sx={{ mt: 4 }}>
        Hello Cover page
      </Typography>
    </Container>
  );
}

export default CoverLetter;