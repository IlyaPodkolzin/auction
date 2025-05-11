import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import axios from '../utils/axios';
import LotStatus from '../components/LotStatus';

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  lot: {
    id: string;
    title: string;
    description: string;
    currentPrice: number;
    endTime: string;
    status: string;
    images: string[];
  };
}

const MyBids: React.FC = () => {
  const navigate = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await axios.get('/api/bids/user');
        setBids(response.data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке ставок:', err);
        setError('Не удалось загрузить ваши ставки. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Мои ставки
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {bids.length === 0 ? (
        <Alert severity="info">
          У вас пока нет ставок.
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {bids.map((bid) => (
            <Grid item key={bid.id} xs={12} sm={6} md={4}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={`${process.env.REACT_APP_API_URL}/uploads/${bid.lot.images[0]}`}
                  alt={bid.lot.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {bid.lot.title}
                    </Typography>
                    <LotStatus status={bid.lot.status} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {bid.lot.description}
                  </Typography>
                  <Box sx={{ my: 2 }}>
                    <Typography variant="h6" color="primary">
                      Ваша ставка: {bid.amount} ₽
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Текущая цена: {bid.lot.currentPrice} ₽
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Завершение: {format(new Date(bid.lot.endTime), 'PPp', { locale: ru })}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => navigate(`/lots/${bid.lot.id}`)}
                  >
                    Просмотр лота
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MyBids; 