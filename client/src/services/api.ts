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

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  leaveDate: string;
  reason?: string | null;
}

export interface DoctorAdminInfo {
  id: string;
  name: string;
  email: string;
  specialization: string;
  experience: number;
  slotDuration: number;
  isActive: boolean;
  doctorProfileId?: string;
  availabilities?: DoctorAvailability[];
  leaves?: DoctorLeave[];
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
  },

  // Admin Doctor Management Methods
  adminCreateDoctor: async (payload: {
    name: string;
    email: string;
    password: string;
    specialization: string;
    experience?: number | null;
    slotDuration: number;
  }): Promise<{ success: boolean; message: string; doctor: any }> => {
    const response = await fetch(`${API_URL}/api/admin/doctors`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create doctor account');
    }
    return data;
  },

  adminGetDoctors: async (): Promise<{ success: boolean; doctors: DoctorAdminInfo[] }> => {
    const response = await fetch(`${API_URL}/api/admin/doctors`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch doctors list');
    }
    return data;
  },

  adminGetDoctor: async (id: string): Promise<{ success: boolean; doctor: DoctorAdminInfo }> => {
    const response = await fetch(`${API_URL}/api/admin/doctors/${id}`, {
      method: 'GET',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch doctor details');
    }
    return data;
  },

  adminUpdateDoctor: async (id: string, payload: {
    name?: string;
    specialization?: string;
    experience?: number | null;
    slotDuration?: number;
    isActive?: boolean;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/api/admin/doctors/${id}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update doctor profile');
    }
    return data;
  },

  adminAddAvailability: async (doctorId: string, payload: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }): Promise<{ success: boolean; message: string; availability: DoctorAvailability }> => {
    const response = await fetch(`${API_URL}/api/admin/doctors/${doctorId}/availability`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add availability slot');
    }
    return data;
  },

  adminDeleteAvailability: async (doctorId: string, availabilityId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/api/admin/doctors/${doctorId}/availability/${availabilityId}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete availability slot');
    }
    return data;
  },

  adminAddLeave: async (doctorId: string, payload: {
    leaveDate: string;
    reason?: string | null;
  }): Promise<{ success: boolean; message: string; leave: DoctorLeave }> => {
    const response = await fetch(`${API_URL}/api/admin/doctors/${doctorId}/leaves`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add leave record');
    }
    return data;
  },

  adminDeleteLeave: async (doctorId: string, leaveId: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/api/admin/doctors/${doctorId}/leaves/${leaveId}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete leave record');
    }
    return data;
  }
};
