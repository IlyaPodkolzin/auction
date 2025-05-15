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
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
      console.log(formData);

      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') {
          value.forEach((file: File) => {
            formDataToSend.append('images', file);
          });
        } else {
          formDataToSend.append(key, value);
        }
      });
      console.log(formDataToSend.get("title"));

      const response = await axios.post('/api/lots', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      

      navigate(`/lots/${response.data.id}`);
    } catch (error) {
      console.error('Ошибка при создании лота:', error);
      setError('Не удалось создать лот. Пожалуйста, попробуйте снова.');
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
                label="Название лота"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                inputProps={{ maxLength: 40 }}
                helperText={`${formData.title.length}/40 символов`}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Описание лота"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                inputProps={{ maxLength: 400 }}
                helperText={`${formData.description.length}/400 символов`}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Начальная цена"
                name="startPrice"
                value={formData.startPrice}
                onChange={handleInputChange}
                inputProps={{ min: 0, step: 0.01, max: 1000000000 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Категория</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="Категория"
                  onChange={handleSelectChange}
                >
                  {Object.entries(Category).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {CategoryTranslations[value]}
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
                label="Время начала"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date().toISOString().slice(0, 16)
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="datetime-local"
                label="Время окончания"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: formData.startTime || new Date().toISOString().slice(0, 16)
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                >
                  Загрузить изображения
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const files = Array.from(e.target.files);
                        setFormData(prev => ({
                          ...prev,
                          images: files
                        }));
                      }
                    }}
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                  />
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                >
                  Сделать фото
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const files = Array.from(e.target.files);
                        setFormData(prev => ({
                          ...prev,
                          images: [...prev.images, ...files]
                        }));
                      }
                    }}
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                  />
                </Button>
                {formData.images.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {formData.images.length} изображение(й) выбрано
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {formData.images.map((file, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            width: 100,
                            height: 100,
                            border: '1px solid #ccc',
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)'
                              }
                            }}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index)
                              }));
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Создание...' : 'Создать лот'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateLot; 