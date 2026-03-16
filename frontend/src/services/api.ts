import axios, { AxiosError } from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Set up axios interceptor to include JWT token in headers
axios.interceptors.request.use(
  (config) => {
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

// Response interceptor to handle 401 errors (token expired/invalid)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired, clear all auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('email');
      localStorage.removeItem('parentName');
      localStorage.removeItem('role');
      localStorage.removeItem('is_admin');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

interface AuthResponse {
  message: string;
  token?: string;
}

export const registerUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/register`,
      { email, password }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data || { message: "Registration failed" };
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/login`,
      { email, password }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data || { message: "Login failed" };
  }
};
