import { useState } from 'react';
import { Box, Button, Typography, Card, CardContent, Switch, IconButton } from '@mui/material';
import { styled } from '@mui/system';

import StarIcon from '@mui/icons-material/Star';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { motion } from 'framer-motion';

import { apiFetch } from '@/lib/api-client';
import { PLANS } from '@stockflow/shared/plans';

const StyledCard = styled(Card)(({ theme, variant }) => ({
  maxWidth: 500,
  backgroundColor: '#141414',

  color: '#ffffff',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  position: 'relative',
  borderColor: variant === 'highlighted' ? '#0A84FF' : '#1e1e1e',
  transition: 'background-color 0.3s, color 0.3s',
  '&:hover': {
    backgroundColor: 'blue',
    color: '#ffffff',
    '& .MuiTypography-root': {
      color: '#ffffff',
    },
    '& .MuiButton-root': {
      backgroundColor: '#ffffff',
      color: '#0A84FF',
    },
    '& .MuiIconButton-root': {
      color: '#ffffff',
    },
  },
}));

const PriceText = styled(Typography)({
  fontSize: '30px',
  fontWeight: 'bold',
});

const PlanTitle = styled(Typography)({
  fontSize: '22px',
  color: '#C7C7C7',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const FeatureText = styled(Typography)({
  fontSize: '16px',
  color: '#A6A6A6',
});

const ButtonStyled = styled(Button)({
  backgroundColor: 'blue',
  color: '#fff',
  borderRadius: 20,
  marginTop: 16,
  padding: '10px 24px',
  '&:hover': {
    backgroundColor: '#0077E4',
  },
});

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

const PricingCard = ({
  plan,
  title,
  price,
  features,
  buttonLabel,
  variant,
  icon,
  billingPeriod,
  handleCheckout,
}) => (
  <StyledCard variant={variant}>
    <CardContent>
      <PlanTitle variant="h6">
        <IconButton size="small" sx={{ color: 'yellow' }}>
          {icon}
        </IconButton>
        {title}
      </PlanTitle>
      <PriceText>{price}</PriceText>
      <Box
        mt={2}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          color: '#fff',
          fontSize: '16px',
        }}
      >
        {features.map((feature, index) => (
          <FeatureText
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: '500',
              color: '#fff',
            }}
          >
            ✓ {feature}
          </FeatureText>
        ))}
      </Box>

      <ButtonStyled onClick={() => handleCheckout(plan, billingPeriod)}>{buttonLabel}</ButtonStyled>
    </CardContent>
  </StyledCard>
);

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const handleToggle = () => setIsAnnual(!isAnnual);

  const handleCheckout = async (plan, billingPeriod) => {
    try {
      const { id: checkoutUrl } = await apiFetch('/api/user/pricing', {
        method: 'POST',
        body: { plan, billingPeriod },
      });
      window.location.href = checkoutUrl;
    } catch (error) {
      alert(error.message);
    }
  };

  const priceLabel = (plan) =>
    isAnnual ? `${PLANS[plan].annual} USD/year` : `${PLANS[plan].monthly} USD/mo`;

  return (
    <BackgroundBox>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          padding: 8,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#ffffff',
            m: 11,
          }}
        >
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
                background: 'blue',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 'bold',
                textAlign: 'center',
                textTransform: 'uppercase',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
                transition: 'background 0.3s ease',
                '&:hover': {
                  background: 'blue',
                  boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.25)',
                },
              }}
            >
              <Typography variant="body1">Bill Monthly</Typography>
            </Box>
          </motion.div>

          <Switch checked={isAnnual} onChange={handleToggle} color="warning" />

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
                background: 'blue',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 'bold',
                textAlign: 'center',
                textTransform: 'uppercase',
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
                transition: 'background 0.3s ease',
                '&:hover': {
                  background: 'blue',
                  boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.25)',
                },
              }}
            >
              <Typography variant="body1">Annual</Typography>
            </Box>
          </motion.div>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
          <PricingCard
            plan="report"
            title={PLANS.report.title}
            price={priceLabel('report')}
            features={['One-off report', 'Lorem ipsum dolor sit']}
            buttonLabel="Purchase"
            icon={<AssessmentIcon />}
            billingPeriod={isAnnual ? 'annual' : 'monthly'}
            handleCheckout={handleCheckout}
          />
          <PricingCard
            plan="starter"
            title={PLANS.starter.title}
            price={priceLabel('starter')}
            features={
              isAnnual
                ? [
                    'AI insights and reorder alerts',
                    'Custom dashboards with analytics',
                    'Priority customer support',
                    'Advanced inventory categorization',
                  ]
                : ['Basic inventory tools', 'Real-time stock updates', 'User and admin roles']
            }
            buttonLabel="Get Started"
            variant="highlighted"
            icon={<FlashOnIcon />}
            billingPeriod={isAnnual ? 'annual' : 'monthly'}
            handleCheckout={handleCheckout}
          />

          <PricingCard
            plan="agency"
            title={PLANS.agency.title}
            price={priceLabel('agency')}
            features={
              isAnnual
                ? [
                    'AI insights and reorder alerts',
                    'Custom dashboards with analytics',
                    'Priority customer support',
                    'Advanced inventory categorization',
                    'Enhanced security features',
                  ]
                : ['Basic inventory tools', 'Real-time stock updates', 'User and admin roles']
            }
            buttonLabel="Get Started"
            icon={<StarIcon />}
            billingPeriod={isAnnual ? 'annual' : 'monthly'}
            handleCheckout={handleCheckout}
          />
        </Box>
      </Box>
    </BackgroundBox>
  );
};

export default PricingPage;
