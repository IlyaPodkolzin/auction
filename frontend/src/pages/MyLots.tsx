import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';
import LotStatus from '../components/LotStatus';

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
}

const MyLots: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const response = await axios.get('/api/lots/my-lots');
      setLots(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching lots:', err);
      setError('Failed to load your lots');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (lot: Lot) => {
    setSelectedLot(lot);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLot) return;

    try {
      await axios.delete(`/api/lots/${selectedLot.id}`);
      setLots(lots.filter(lot => lot.id !== selectedLot.id));
      setDeleteDialogOpen(false);
      setSelectedLot(null);
    } catch (err) {
      console.error('Error deleting lot:', err);
      setError('Failed to delete lot');
    }
  };

  if (!user) {
    return (
      <Container>
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          Войдите в систему, чтобы просматривать свои лоты
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Мои лоты
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {lots.map((lot) => (
          <Grid item xs={12} sm={6} md={4} key={lot.id}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={`${process.env.REACT_APP_API_URL}/uploads/${lot.images[0]}`}
                alt={lot.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" component="div" noWrap>
                    {lot.title}
                  </Typography>
                  <LotStatus status={lot.status} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Текущая цена: ₽{lot.currentPrice}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Заканчивается: {new Date(lot.endTime).toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/lots/${lot.id}`)}
                  >
                    Просмотр лота
                  </Button>
                  {lot.status === 'PENDING' && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteClick(lot)}
                      startIcon={<DeleteIcon />}
                    >
                      Удалить
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Lot</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить "{selectedLot?.title}"? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отменить</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyLots; 