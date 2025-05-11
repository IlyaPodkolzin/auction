import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import axios from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';

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

interface LotFormData {
  title: string;
  description: string;
  startPrice: string;
  startTime: string;
  endTime: string;
  category: CategoryType;
  images: File[];
}

const CreateLot: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<LotFormData>({
    title: '',
    description: '',
    startPrice: '',
    startTime: '',
    endTime: '',
    category: Category.OTHER,
    images: []
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        images: Array.from(e.target.files!)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') {
          value.forEach((file: File) => {
            formDataToSend.append('images', file);
          });
        } else {
          formDataToSend.append(key, value);
        }
      });

      const response = await axios.post('/api/lots', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate(`/lots/${response.data.id}`);
    } catch (error) {
      console.error('Error creating lot:', error);
      setError('Failed to create lot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <Typography variant="h5" align="center" sx={{ mt: 4 }}>
          Войдите в систему, чтобы создать лот
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Создать новый лот
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Starting Price"
                name="startPrice"
                value={formData.startPrice}
                onChange={handleInputChange}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="Category"
                  onChange={handleSelectChange}
                >
                  {Object.entries(Category).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {key.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="datetime-local"
                label="Start Time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="datetime-local"
                label="End Time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                component="label"
                fullWidth
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              {formData.images.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {formData.images.length} image(s) selected
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Lot'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateLot; 