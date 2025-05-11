import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Paper,
  SelectChangeEvent,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import LotStatus from '../components/LotStatus';

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

type CategoryType = typeof Category[keyof typeof Category];

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
  category: CategoryType;
  seller: {
    id: string;
    name: string;
    profileImage: string;
  };
}

const Home: React.FC = () => {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Filter states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryType | ''>('');
  const [status, setStatus] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLots = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const response = await axios.get(`/api/lots?${params.toString()}`);
      setLots(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch lots');
      console.error('Error fetching lots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, [search, category, status, minPrice, maxPrice, sortBy, sortOrder]);

  const handleLotClick = (lotId: string) => {
    navigate(`/lots/${lotId}`);
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value as CategoryType);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  const handleSortOrderChange = (event: SelectChangeEvent) => {
    setSortOrder(event.target.value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search lots"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Категория</InputLabel>
              <Select
                value={category}
                label="Категория"
                onChange={handleCategoryChange}
              >
                <MenuItem value="">Все категории</MenuItem>
                {Object.entries(Category).map(([key, value]) => (
                  <MenuItem key={key} value={value}>
                    {key.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={status}
                label="Статус"
                onChange={handleStatusChange}
              >
                <MenuItem value="">Все статусы</MenuItem>
                <MenuItem value="ACTIVE">Активный</MenuItem>
                <MenuItem value="SOLD">Продан</MenuItem>
                <MenuItem value="CANCELLED">Отменен</MenuItem>
                <MenuItem value="PENDING">Ожидание</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Сортировать по</InputLabel>
              <Select
                value={sortBy}
                label="Сортировать по"
                onChange={handleSortChange}
              >
                <MenuItem value="createdAt">Дата создания</MenuItem>
                <MenuItem value="currentPrice">Цена</MenuItem>
                <MenuItem value="endTime">Время окончания</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Сортировать по</InputLabel>
              <Select
                value={sortOrder}
                label="Сортировать по"
                onChange={handleSortOrderChange}
              >
                <MenuItem value="asc">По возрастанию</MenuItem>
                <MenuItem value="desc">По убыванию</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Min Price"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Max Price"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {loading ? (
        <Typography>Загрузка...</Typography>
      ) : (
        <Grid container spacing={3}>
          {lots.map((lot) => (
            <Grid item key={lot.id} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer'
                }}
                onClick={() => handleLotClick(lot.id)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={`${process.env.REACT_APP_API_URL}/uploads/${lot.images[0]}`}
                  alt={lot.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="h2" noWrap>
                      {lot.title}
                    </Typography>
                    <LotStatus status={lot.status} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {lot.description.length > 100
                      ? `${lot.description.substring(0, 100)}...`
                      : lot.description}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    Текущая цена: ₽{lot.currentPrice}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Заканчивается: {new Date(lot.endTime).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Категория: {lot.category.replace('_', ' ')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Home; 