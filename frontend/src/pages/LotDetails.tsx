import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  ImageList,
  ImageListItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import { io, Socket } from 'socket.io-client';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';

interface Bid {
  id: string;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    profileImage: string | null;
  };
}

interface Lot {
  id: string;
  title: string;
  description: string;
  startPrice: number;
  currentPrice: number;
  images: string[];
  startTime: string;
  endTime: string;
  status: string;
  seller: {
    id: string;
    name: string | null;
    profileImage: string | null;
  };
  bids: Bid[];
}

const LotDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [lot, setLot] = useState<Lot | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchLot = async () => {
      try {
        const response = await axios.get(`/api/lots/${id}`);
        setLot(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching lot:', err);
        setError('Failed to load lot details');
      } finally {
        setLoading(false);
      }
    };

    fetchLot();

    // Connect to WebSocket
    const newSocket = io(process.env.REACT_APP_WS_URL || '');
    setSocket(newSocket);

    newSocket.emit('joinLot', id);

    newSocket.on('newBid', (data: { bid: Bid; currentPrice: number }) => {
      setLot(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentPrice: data.currentPrice,
          bids: [data.bid, ...prev.bids]
        };
      });
    });

    newSocket.on('error', (message: string) => {
      setError(message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id]);

  const handleBid = async () => {
    if (!lot || !bidAmount) return;

    const amount = parseFloat(bidAmount);
    if (amount <= lot.currentPrice) {
      setError('Ваша ставка должна быть выше текущей цены');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await axios.post('/api/bids', {
        lotId: lot.id,
        amount
      });
      setBidAmount('');
      setSuccess('Ставка успешно размещена!');
    } catch (err) {
      console.error('Ошибка при размещении ставки:', err);
      setError('Не удалось разместить ставку. Пожалуйста, попробуйте позже.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!lot) {
    return (
      <Container>
        <Typography variant="h5" color="error">
          Лот не найден
        </Typography>
      </Container>
    );
  }

  const isAuctionEnded = new Date(lot.endTime) < new Date();
  const isOwner = user?.id === lot.seller.id;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <ImageList sx={{ width: '100%', height: 450 }} cols={1} rowHeight={450}>
              {lot.images.map((image, index) => (
                <ImageListItem key={index}>
                  <img
                    src={`${process.env.REACT_APP_API_URL}/uploads/${image}`}
                    alt={`${lot.title} - Image ${index + 1}`}
                    loading="lazy"
                    style={{ objectFit: 'contain' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {lot.title}
            </Typography>
            <Typography variant="body1" paragraph>
              {lot.description}
            </Typography>
            <Box sx={{ my: 2 }}>
              <Typography variant="h6" color="primary">
                Текущая цена: ₽{lot.currentPrice}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Начальная цена: ₽{lot.startPrice}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Заканчивается: {format(new Date(lot.endTime), 'PPp')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Продавец: {lot.seller.name || 'Аноним'}
              </Typography>
            </Box>

            {isAuthenticated && !isOwner && !isAuctionEnded && lot.status === 'ACTIVE' && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Your Bid"
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  sx={{ mb: 2 }}
                  inputProps={{ min: lot.currentPrice + 0.01, step: 0.01 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleBid}
                  disabled={!bidAmount}
                >
                  Разместить ставку
                </Button>
              </Box>
            )}

            {isAuctionEnded && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Этот аукцион закончился
              </Alert>
            )}

            {isOwner && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Вы продавец этого лота
              </Alert>
            )}
          </Paper>

          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Bid History
            </Typography>
            <List>
              {lot.bids.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No bids yet
                </Typography>
              ) : (
                lot.bids.map((bid) => (
                  <React.Fragment key={bid.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={bid.user.profileImage || undefined} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={`$${bid.amount.toFixed(2)}`}
                        secondary={`${bid.user.name || 'Anonymous'} - ${format(new Date(bid.createdAt), 'PPp')}`}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LotDetails; 