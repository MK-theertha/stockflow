import { Box, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/system';

import { APP_NAME } from '@/lib/brand';

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`;

const glow = keyframes`
  0% {
    text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #ff00ff, 0 0 20px #ff00ff, 0 0 25px #ff00ff, 0 0 30px #ff00ff, 0 0 35px #ff00ff;
  }
  50% {
    text-shadow: 0 0 10px #fff, 0 0 20px #ff00ff, 0 0 30px #ff00ff, 0 0 40px #ff00ff, 0 0 50px #ff00ff, 0 0 60px #ff00ff, 0 0 70px #ff00ff;
  }
  100% {
    text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #ff00ff, 0 0 20px #ff00ff, 0 0 25px #ff00ff, 0 0 30px #ff00ff, 0 0 35px #ff00ff;
  }
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(0deg);
  }
`;

const styles = [
  {
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '2rem',
    fontStyle: 'italic',
    textShadow: '2px 2px 4px #000000',
  },
  {
    color: 'green',
    fontSize: '2rem',
    textDecoration: 'underline',
    fontWeight: 'bolder',
    transform: 'skewX(-10deg)',
  },
  {
    color: 'red',
    fontSize: '2rem',
    fontWeight: 'bold',
    textShadow: '2px 2px 4px #000000',
    animation: `${rotate} 2s infinite`,
  },
  {
    background: 'linear-gradient(to right, #30CFD0 0%, #330867 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '2rem',
    letterSpacing: '5px',
    textShadow: '2px 2px 4px #000000',
    animation: `${pulse} 2s infinite`,
  },
  {
    background: 'linear-gradient(to right, #30CFD0 0%, #330867 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '2rem',
    letterSpacing: '5px',
    textShadow: '2px 2px 4px #000000',
    animation: `${pulse} 2s infinite`,
  },
  {
    color: 'orange',
    fontSize: '2rem',
    textShadow: '2px 2px 4px #000000',
    transform: 'rotate(10deg)',
  },
  {
    background: 'linear-gradient(to left, #f7ff00, red)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '2rem',
    fontWeight: 'lighter',
    animation: `${glow} 1.5s infinite`,
  },
  {
    color: 'green',
    fontSize: '2rem',
    textDecoration: 'underline',
    fontWeight: 'bolder',
    transform: 'skewX(-10deg)',
  },
  {
    background: 'linear-gradient(to right, #30CFD0 0%, #330867 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '2rem',
    letterSpacing: '5px',
    textShadow: '2px 2px 4px #000000',
    animation: `${pulse} 2s infinite`,
  },
  {
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '2rem',
    fontStyle: 'italic',
    textShadow: '2px 2px 4px #000000',
  },
];

const StyledTypography = styled(Typography)``;

const BrandLogo = () => {
  return (
    <Box display="flex">
      {APP_NAME.split('').map((char, index) => (
        <StyledTypography key={index} sx={styles[index]}>
          {char}
        </StyledTypography>
      ))}
    </Box>
  );
};

export default BrandLogo;
