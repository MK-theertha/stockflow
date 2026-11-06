import { useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/layout/BrandLogo';

import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Switch,
  Stack,
} from '@mui/material';
import { styled } from '@mui/system';
import {
  Dashboard,
  Inventory,
  Add,
  ListAlt,
  Assessment,
  ShoppingCart,
  People,
  Settings,
  BarChart,
} from '@mui/icons-material';

import { motion } from 'framer-motion';
import { useState } from 'react';

const pages = [
  { name: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { name: 'Products', icon: <Inventory />, path: '/products' },
  { name: 'Add Product', icon: <Add />, path: '/add-product' },
  { name: 'Inventory', icon: <ListAlt />, path: '/inventory' },
  { name: 'Orders', icon: <ShoppingCart />, path: '/orders' },
  { name: 'Reports', icon: <Assessment />, path: '/reports' },
  { name: 'Customers', icon: <People />, path: '/customers' },
  { name: 'Settings', icon: <Settings />, path: '/settings' },
  { name: 'Analytics', icon: <BarChart />, path: '/analytics' },
];

const BackgroundBox = styled(Box)({
  backgroundImage: 'url("/images/pos1.png")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  position: 'relative',
  padding: '4rem 2rem',
  textAlign: 'center',
  color: '#fff',
  overflow: 'hidden',
});

const Overlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  zIndex: 1,
});

const ContentBox = styled(Box)({
  position: 'relative',
  zIndex: 2,
});

const HomePage = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <BackgroundBox>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '10vh',
            backgroundColor: 'linear-gradient(to right, #ff7e5f, #feb47b)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            p: 4,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#fff',
              textAlign: 'center',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          >
            <BrandLogo />
          </Typography>
        </Box>
      </motion.div>

      <Overlay />
      <ContentBox>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  mb: 2,
                  background: 'linear-gradient(90deg, #ff8a00, #e52e71)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                Welcome to the Product Inventory System
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <Typography
                variant="h6"
                color="inherit"
                sx={{
                  mb: 3,
                  lineHeight: 1.6,
                  color: '#d1d1d1',
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Manage your products, inventory, and orders efficiently with our intuitive
                dashboard.
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{
                  mb: 4,
                  background: 'linear-gradient(135deg, #42a5f5, #478ed1)',
                  color: '#fff',
                  boxShadow: '0px 4px 10px rgba(66, 165, 245, 0.3)',
                  borderRadius: '30px',
                  padding: '0.8rem 2.5rem',
                  fontWeight: 'bold',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0px 6px 12px rgba(66, 165, 245, 0.5)',
                  },
                }}
              >
                Get Started
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        <Box sx={{ mb: 5 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                fontSize: '2rem',
                letterSpacing: '0.05em',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                color: '#fff',
                display: 'inline-block',
                textShadow: '1px 2px 6px rgba(0, 0, 0, 0.2)',
              }}
            >
              Choose Your Subscription
            </Typography>
          </motion.div>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Box
                sx={{
                  display: 'inline-block',
                  padding: '0.3rem 1rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
                  transition: 'background 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #66bb6a, #388e3c)',
                    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.25)',
                  },
                }}
              >
                <Typography variant="body1">Monthly</Typography>
              </Box>
            </motion.div>
            <Switch
              checked={isAnnual}
              onChange={() => setIsAnnual(!isAnnual)}
              inputProps={{ 'aria-label': 'Toggle Subscription' }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Box
                sx={{
                  display: 'inline-block',
                  padding: '0.3rem 1rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
                  transition: 'background 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #66bb6a, #388e3c)',
                    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.25)',
                  },
                }}
              >
                <Typography variant="body1">Annual</Typography>
              </Box>
            </motion.div>
          </Stack>
          <Typography variant="h4" color="primary" sx={{ mt: 2, fontWeight: 'bold' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Box
                sx={{
                  display: 'inline-block',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '25px',
                  background: 'linear-gradient(90deg, #ff8a00, #e52e71)',
                  color: '#fff',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
                  transition: 'background 0.3s ease, transform 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #e52e71, #ff8a00)',
                    transform: 'scale(1.05)',
                    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.25)',
                  },
                }}
              >
                <Typography variant="body1">{isAnnual ? '$99 / year' : '$10 / month'}</Typography>
              </Box>
            </motion.div>
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {pages.map((page, index) => (
            <Grid item key={page.name} xs={12} sm={6} md={4}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
              >
                <Card
                  sx={{
                    minHeight: 180,
                    boxShadow: 5,
                    borderRadius: 2,
                    backgroundColor: '#000',
                    color: '#fff',
                    transition: 'transform 0.3s, background-color 0.3s, color 0.3s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      backgroundColor: 'blue',
                      color: '#fff',
                    },
                  }}
                >
                  <CardActionArea onClick={() => navigate(page.path)}>
                    <CardContent sx={{ textAlign: 'center', padding: '2rem' }}>
                      <Box sx={{ fontSize: 58, mb: 1, color: 'greenyellow' }}>{page.icon}</Box>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        {page.name}
                      </Typography>
                      <Typography variant="body2" color="inherit">
                        {`Go to ${page.name} section`}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </ContentBox>
    </BackgroundBox>
  );
};

export default HomePage;
