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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { io, Socket } from 'socket.io-client';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import { Delete as DeleteIcon } from '@mui/icons-material';

// Define categories enum
const Category = {
  ANTIQUES: 'ANTIQUES',
  ART: 'ART',
  AUTOMOBILES: 'AUTOMOBILES',
  BOOKS: 'BOOKS',
  CLOTHING: 'CLOTHING',
  COLLECTIBLES: 'COLLECTIBLES',
  COMPUTERS: 'COMPUTERS',
  ELECTRONICS: 'ELECTRONICS',
  FURNITURE: 'FURNITURE',
  HOME_DECOR: 'HOME_DECOR',
  JEWELRY: 'JEWELRY',
  MUSICAL_INSTRUMENTS: 'MUSICAL_INSTRUMENTS',
  SPORTS_EQUIPMENT: 'SPORTS_EQUIPMENT',
  STAMPS: 'STAMPS',
  TOYS: 'TOYS',
  VINTAGE_ITEMS: 'VINTAGE_ITEMS',
  WATCHES: 'WATCHES',
  WINE: 'WINE',
  WINE_ACCESSORIES: 'WINE_ACCESSORIES',
  OTHER: 'OTHER'
} as const;

// Russian translations for categories
const CategoryTranslations: Record<CategoryType, string> = {
  ANTIQUES: 'Антиквариат',
  ART: 'Искусство',
  AUTOMOBILES: 'Автомобили',
  BOOKS: 'Книги',
  CLOTHING: 'Одежда',
  COLLECTIBLES: 'Коллекционные предметы',
  COMPUTERS: 'Компьютеры',
  ELECTRONICS: 'Электроника',
  FURNITURE: 'Мебель',
  HOME_DECOR: 'Декор для дома',
  JEWELRY: 'Украшения',
  MUSICAL_INSTRUMENTS: 'Музыкальные инструменты',
  SPORTS_EQUIPMENT: 'Спортивное оборудование',
  STAMPS: 'Марки',
  TOYS: 'Игрушки',
  VINTAGE_ITEMS: 'Винтажные вещи',
  WATCHES: 'Часы',
  WINE: 'Вино',
  WINE_ACCESSORIES: 'Аксессуары для вина',
  OTHER: 'Другое'
};

type CategoryType = typeof Category[keyof typeof Category];

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
  category: CategoryType;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBidDialogOpen, setDeleteBidDialogOpen] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!lot) return;

    try {
      await axios.delete(`/api/lots/${lot.id}`);
      setDeleteDialogOpen(false);
      navigate('/my-lots');
    } catch (err: any) {
      console.error('Ошибка при удалении лота:', err);
      console.error('Ответ сервера:', err.response);
      setError(err.response?.data?.error || 'Не удалось удалить лот');
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteBidClick = (bidId: string) => {
    setSelectedBidId(bidId);
    setDeleteBidDialogOpen(true);
  };

  const handleDeleteBidConfirm = async () => {
    if (!selectedBidId) return;

    try {
      await axios.delete(`/api/bids/${selectedBidId}`);
      setDeleteBidDialogOpen(false);
      setSelectedBidId(null);
      
      // Обновляем данные лота
      const response = await axios.get(`/api/lots/${id}`);
      setLot(response.data);
      setSuccess('Ставка успешно удалена');
    } catch (err: any) {
      console.error('Ошибка при удалении ставки:', err);
      setError(err.response?.data?.error || 'Не удалось удалить ставку');
      setDeleteBidDialogOpen(false);
      setSelectedBidId(null);
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
                    alt={`${lot.title} - Изображение ${index + 1}`}
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
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                fontSize: {
                  xs: '1.5rem',
                  sm: '2rem',
                  md: '2.125rem'
                }
              }}
            >
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
                Начало: {format(new Date(lot.startTime), 'd MMMM yyyy, HH:mm', { locale: ru })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Заканчивается: {format(new Date(lot.endTime), 'd MMMM yyyy, HH:mm', { locale: ru })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Продавец: <Typography
                  component="span"
                  sx={{
                    color: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={() => navigate(`/profile/${lot.seller.id}`)}
                >
                  {lot.seller.name || 'Аноним'}
                </Typography>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Категория: {CategoryTranslations[lot.category]}
              </Typography>
            </Box>

            {isAuthenticated && !isOwner && !isAuctionEnded && lot.status === 'ACTIVE' && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Ваша ставка"
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  sx={{ mb: 2 }}
                  inputProps={{ min: lot.currentPrice + 0.01, step: 0.01, max: 1000000000 }}
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

            {(isOwner) && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Вы продавец этого лота
                </Alert>
              </Box>
            )}

            {(isOwner || currentUser?.role === 'ADMIN') && (
              <Box sx={{ mt: 2 }}>
                <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleDeleteClick}
                startIcon={<DeleteIcon />}
                >
                  Удалить лот
                </Button>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              История ставок
            </Typography>
            <List>
              {lot.bids.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Пока нет ставок
                </Typography>
              ) : (
                lot.bids.map((bid) => (
                  <ListItem
                    key={bid.id}
                    secondaryAction={
                      currentUser?.role === 'ADMIN' && (
                        <IconButton
                          edge="end"
                          aria-label="удалить"
                          onClick={() => handleDeleteBidClick(bid.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={bid.user.profileImage ? `${process.env.REACT_APP_API_URL}/uploads/${bid.user.profileImage}` : undefined}
                        onClick={() => navigate(`/profile/${bid.user.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        {bid.user.name?.[0] || '?'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          component="span"
                          onClick={() => navigate(`/profile/${bid.user.id}`)}
                          sx={{ cursor: 'pointer', color: 'primary.main' }}
                        >
                          {bid.user.name || 'Аноним'}
                        </Typography>
                      }
                      secondary={`${bid.amount} ₽`}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Удаление лота</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить "{lot?.title}"? Это действие нельзя отменить.
            Все пользователи, сделавшие ставки на этот лот, получат уведомление об удалении.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отменить</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteBidDialogOpen}
        onClose={() => setDeleteBidDialogOpen(false)}
      >
        <DialogTitle>Удаление ставки</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить эту ставку? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteBidDialogOpen(false)}>Отменить</Button>
          <Button onClick={handleDeleteBidConfirm} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LotDetails; 