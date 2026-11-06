import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

import { apiFetch } from '@/lib/api-client';

const CheckoutSuccessPage = () => {
  const navigate = useNavigate();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;

    hasRunRef.current = true;

    const verifyPayment = async () => {
      if (typeof window !== 'undefined') {
        const query = new URLSearchParams(window.location.search);

        const sessionId = query.get('session_id');

        if (sessionId) {
          try {
            await apiFetch(`/api/user/pricing/success/${sessionId}`);
            navigate('/dashboard/user');
          } catch {
            navigate('/cancel');
          }
        } else {
          navigate('/cancel');
        }
      }
    };

    verifyPayment();
  }, [navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      textAlign="center"
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
        <FaCheckCircle color="#4caf50" size="100" />
      </motion.div>
      <Typography variant="h4" gutterBottom>
        Payment Successful!
      </Typography>
      <Typography variant="body1" gutterBottom>
        Thank you for your subscription. Now Everything is free.
      </Typography>

      <Button
        type="submit"
        variant="contained"
        onClick={() => navigate('/dashboard/user')}
        sx={{
          backgroundColor: 'blue',
          color: 'white',
          '&:hover': {
            backgroundColor: 'blue',
          },
        }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default CheckoutSuccessPage;
