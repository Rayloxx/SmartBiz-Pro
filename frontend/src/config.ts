// SmartBiz Frontend Configuration
// For local testing on mobile, use the machine's local IP (e.g., 192.168.0.110)
// For production, this will be replaced by your actual domain.

import axios from 'axios';

const BACKEND_PORT = '5000';

export const API_URL = typeof window !== 'undefined'
    ? `http://${window.location.hostname || 'localhost'}:${BACKEND_PORT}/api`
    : `http://localhost:${BACKEND_PORT}/api`;

axios.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
