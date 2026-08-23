const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  phone: string;
  gender?: string | null;
  dateOfBirth?: string | null;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialization: string;
  experience?: number | null;
  slotDuration: number;
  isActive: boolean;
}

export interface FullUser extends User {
  patientProfile?: PatientProfile | null;
  doctorProfile?: DoctorProfile | null;
}

export interface HealthResponse {
  success: boolean;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface MeResponse {
  success: boolean;
  user: FullUser;
}

const getHeaders = (includeToken = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  if (includeToken) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

export const api = {
  checkHealth: async (): Promise<HealthResponse> => {
    const response = await fetch(`${API_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    return response.json();
  },

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    phone: string;
    gender?: string;
    dateOfBirth?: string;
  }): Promise<RegisterResponse> => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  login: async (payload: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  getMe: async (): Promise<MeResponse> => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: getHeaders(true)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user profile');
    }
    return data;
  },

  logout: (): void => {
    localStorage.removeItem('token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  }
};
