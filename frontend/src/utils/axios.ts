import axios from 'axios';

// Проверяем, что API URL установлен
if (!process.env.REACT_APP_API_URL) {
  console.error('REACT_APP_API_URL is not defined!');
}

console.log('API URL:', process.env.REACT_APP_API_URL);

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

instance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.baseURL + config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance; 