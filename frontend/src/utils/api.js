import axios from 'axios';

const api = axios.create({
    baseURL: 'https://secure-chat-zy7z.onrender.com/api'
});

export default api;
