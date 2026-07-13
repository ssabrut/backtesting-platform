import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.error || err.message;
    return Promise.reject(new Error(msg));
  }
);

export default client;
