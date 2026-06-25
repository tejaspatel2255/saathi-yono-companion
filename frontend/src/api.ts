import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  language_preference: string;
  financial_profile: {
    age: number;
    income: number;
    savings: number;
    existing_products: string[];
  };
}

export interface RegisterRequest {
  name: string;
  phone: string;
  language_preference: string;
  age: number;
  income: number;
  savings: number;
  existing_products: string[];
}

export interface TransactionRequest {
  amount: number;
  category: string;
  merchant: string;
}

export const registerUser = async (data: RegisterRequest): Promise<UserProfile> => {
  const response = await api.post<UserProfile>('/users/register', data);
  return response.data;
};

export const loginUser = async (phone: string): Promise<UserProfile> => {
  const response = await api.post<UserProfile>('/users/login', { phone });
  return response.data;
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await api.get<UserProfile>(`/profile/${userId}`);
  return response.data;
};

export const updateUserProfile = async (userId: string, data: RegisterRequest): Promise<UserProfile> => {
  const response = await api.put<UserProfile>(`/profile/${userId}`, data);
  return response.data;
};

export const createTransaction = async (userId: string, data: TransactionRequest) => {
  const response = await api.post(`/transactions/${userId}`, data);
  return response.data;
};

export const fetchTransactions = async (userId: string): Promise<any[]> => {
  const response = await api.get<{ transactions: any[] }>(`/transactions/${userId}`);
  return response.data.transactions;
};
