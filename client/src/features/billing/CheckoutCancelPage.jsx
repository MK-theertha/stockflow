import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { FaTimesCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const CheckoutCancelPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bgcolor="black"
      textAlign="center"
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
        <FaTimesCircle color="#f44336" size="100" />
      </motion.div>
      <Typography variant="h4" gutterBottom>
        Payment Failed
      </Typography>
      <Typography variant="body1" gutterBottom>
        Unfortunately, we couldn&apos;t process your payment. Please try again.
      </Typography>
      <Button variant="contained" color="secondary" onClick={() => navigate('/pricing')}>
        Try Again
      </Button>
    </Box>
  );
};

export default CheckoutCancelPage;
