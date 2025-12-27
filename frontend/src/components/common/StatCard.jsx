import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Keyframes for entrance animation
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StyledCard = styled(Card)(({ theme, colorHighlight, delay }) => ({
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '24px', // More rounded
    background: '#ffffff',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring-like transition
    animation: `${fadeInUp} 0.6s ease-out forwards`,
    animationDelay: `${delay}ms`,
    opacity: 0, // Start hidden for animation
    border: '1px solid rgba(0,0,0,0.02)',
    '&:hover': {
        transform: 'translateY(-8px) scale(1.02)',
        boxShadow: `0 20px 40px -15px ${colorHighlight || theme.palette.primary.main}50`,
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '150px',
        height: '100%',
        background: `linear-gradient(135deg, transparent 20%, ${colorHighlight || theme.palette.primary.main}10 100%)`,
        zIndex: 0,
        clipPath: 'circle(70% at 100% 0)', // Circular decorative shape
        transition: 'all 0.5s ease',
    },
    '&:hover::before': {
        transform: 'scale(1.1)',
        background: `linear-gradient(135deg, transparent 10%, ${colorHighlight || theme.palette.primary.main}20 100%)`,
    }
}));

const IconWrapper = styled(Avatar)(({ theme, colorHighlight }) => ({
    background: `linear-gradient(135deg, ${colorHighlight}20 0%, ${colorHighlight}40 100%)`,
    color: colorHighlight || theme.palette.primary.main,
    width: 64,
    height: 64,
    borderRadius: '18px',
    zIndex: 1,
    boxShadow: `0 8px 16px -4px ${colorHighlight}40`,
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'rotate(10deg)',
    }
}));

// Helper to animate numbers
const CountUp = ({ end, duration = 2000, prefix = '', suffix = '' }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease-out expo function
            const easeOut = (x) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);

            setCount(percentage * end);

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    // Format handling: keep decimals if end has them
    const formattedCount = Number.isInteger(end)
        ? Math.floor(count)
        : count.toFixed(1);

    return <>{prefix}{formattedCount}{suffix}</>;
};

const StatCard = ({ title, value, icon, color, subtext, trend, delay = 0 }) => {
    // Parse value for animation if possible
    let numericValue = 0;
    let prefix = '';
    let suffix = '';

    if (typeof value === 'string') {
        const match = value.match(/([^\d\.-]*)([\d\.]+)([^\d\.-]*)/);
        if (match) {
            prefix = match[1];
            numericValue = parseFloat(match[2]);
            suffix = match[3];
        } else {
            // Fallback if no number found
            prefix = value;
        }
    } else {
        numericValue = value;
    }

    const isAnimatable = !isNaN(numericValue) && numericValue !== 0;

    return (
        <StyledCard colorHighlight={color} delay={delay}>
            <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="overline" color="textSecondary" sx={{ fontWeight: 700, letterSpacing: '1px', opacity: 0.8 }}>
                            {title}
                        </Typography>
                        <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-1px' }}>
                            {isAnimatable ? (
                                <CountUp end={numericValue} prefix={prefix} suffix={suffix} />
                            ) : (
                                value
                            )}
                        </Typography>
                        {subtext && (
                            <Box display="flex" alignItems="center" mt={1}>
                                {trend !== undefined && (
                                    <Box
                                        component="span"
                                        sx={{
                                            bgcolor: trend > 0 ? '#dcfce7' : '#fee2e2',
                                            color: trend > 0 ? '#166534' : '#991b1b',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            mr: 1,
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
                                    </Box>
                                )}
                                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                                    {subtext}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <IconWrapper colorHighlight={color} variant="rounded">
                        {icon}
                    </IconWrapper>
                </Box>
            </CardContent>
        </StyledCard>
    );
};

export default StatCard;
