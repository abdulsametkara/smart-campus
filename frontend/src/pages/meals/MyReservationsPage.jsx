import React from 'react';
import { Container, Typography } from '@mui/material';

const MyReservationsPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Rezervasyonlarım</Typography>
      <Typography>Yemekhane rezervasyonları sayfası - Yakında eklenecek</Typography>
    </Container>
  );
};

export default MyReservationsPage;

