import React from 'react';
import { Chip } from '@mui/material';

interface LotStatusProps {
  status: string;
}

const LotStatus: React.FC<LotStatusProps> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bgcolor: '#e8f5e9', color: '#2e7d32' };
      case 'SOLD':
        return { bgcolor: '#2e7d32', color: '#ffffff' };
      case 'CANCELLED':
        return { bgcolor: '#9e9e9e', color: '#ffffff' };
      case 'PENDING':
        return { bgcolor: '#fff3e0', color: '#e65100' };
      default:
        return { bgcolor: '#9e9e9e', color: '#424242' };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активный';
      case 'SOLD':
        return 'Продан';
      case 'CANCELLED':
        return 'Отменен';
      case 'PENDING':
        return 'Ожидает';
      default:
        return status;
    }
  };

  const { bgcolor, color } = getStatusColor(status);

  return (
    <Chip
      label={getStatusText(status)}
      size="small"
      sx={{
        bgcolor,
        color,
        fontWeight: 'medium'
      }}
    />
  );
};

export default LotStatus; 