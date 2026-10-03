// API Service with Fetch

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = `${this.baseURL}${endpoint}`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    return url;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T = any>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    const { params, ...fetchOptions } = options || {};
    const url = this.buildUrl(endpoint, params);
    const headers = this.getHeaders();

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        
        throw new Error(error.message || `HTTP Error: ${response.status}`);
      }

      // 204 No Content (exclusões, vínculos) não tem corpo para ler
      if (response.status === 204) return undefined as T;
      const text = await response.text();
      return (text ? JSON.parse(text) : undefined) as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();

// Authentication endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () =>
    api.post('/auth/logout'),
  resetPassword: (email: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, newPassword }),
};

// School endpoints
export const schoolApi = {
  list: (page = 1, pageSize = 20) => api.get('/schools', { params: { page, pageSize } }),
  get: (id: string) => api.get(`/schools/${id}`),
  create: (data: any) => api.post('/schools', data),
  update: (id: string, data: any) => api.put(`/schools/${id}`, data),
  delete: (id: string) => api.delete(`/schools/${id}`),
};

// User endpoints
export const userApi = {
  list: (page = 1, pageSize = 20, schoolId?: string) =>
    api.get('/users', { params: { page, pageSize, schoolId } }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/auth/me'),
  assignClass: (teacherId: string, classId: string) =>
    api.post(`/users/${teacherId}/assign-class/${classId}`),
  unassignClass: (teacherId: string, classId: string) =>
    api.delete(`/users/${teacherId}/assign-class/${classId}`),
  assignStudent: (parentId: string, studentId: string) =>
    api.post(`/users/${parentId}/assign-student/${studentId}`),
  unassignStudent: (parentId: string, studentId: string) =>
    api.delete(`/users/${parentId}/assign-student/${studentId}`),
  assignOrientadorClass: (orientadorId: string, classId: string) =>
    api.post(`/users/${orientadorId}/assign-orientador-class/${classId}`),
  unassignOrientadorClass: (orientadorId: string, classId: string) =>
    api.delete(`/users/${orientadorId}/assign-orientador-class/${classId}`),
};

// Class endpoints
export const classApi = {
  list: (page = 1, pageSize = 50, schoolId?: string) =>
    api.get('/classes', { params: { page, pageSize, schoolId } }),
  get: (id: string) => api.get(`/classes/${id}`),
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.put(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
};

// Student endpoints
export const studentApi = {
  list: (page = 1, pageSize = 50, classId?: string, schoolId?: string) =>
    api.get('/students', { params: { page, pageSize, classId, schoolId } }),
  get: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
};

// Grade endpoints
export const gradeApi = {
  list: (page = 1, pageSize = 200, classId?: string, studentId?: string) =>
    api.get('/grades', { params: { page, pageSize, classId, studentId } }),
  get: (id: string) => api.get(`/grades/${id}`),
  create: (data: any) => api.post('/grades', data),
  update: (id: string, data: any) => api.put(`/grades/${id}`, data),
  delete: (id: string) => api.delete(`/grades/${id}`),
};

// Attendance endpoints
export const attendanceApi = {
  list: (page = 1, pageSize = 500, classId?: string, studentId?: string, date?: string) =>
    api.get('/attendance', { params: { page, pageSize, classId, studentId, date } }),
  get: (id: string) => api.get(`/attendance/${id}`),
  create: (data: any) => api.post('/attendance', data),
  update: (id: string, data: any) => api.put(`/attendance/${id}`, data),
  bulkCreate: (data: any[]) => api.post('/attendance/bulk', data),
};

// Pending Works endpoints
export const pendingWorkApi = {
  list: (page = 1, pageSize = 100) =>
    api.get('/pending-works', { params: { page, pageSize } }),
  get: (id: string) => api.get(`/pending-works/${id}`),
  create: (data: any) => api.post('/pending-works', data),
  markDelivered: (id: string) => api.put(`/pending-works/${id}/delivered`),
};

// Dashboard endpoints (já existentes na API: GET /api/admin/stats)
export const dashboardApi = {
  adminStats: () => api.get('/admin/stats'),
};

// Disciplinary Report endpoints
export const disciplinaryApi = {
  // page/pageSize opcionais: sem eles a API devolve só os 20 primeiros
  list: (schoolId?: string, studentId?: string, status?: string, page?: number, pageSize?: number) =>
    api.get('/disciplinary-calls', { params: { schoolId, studentId, status, page, pageSize } }),
  get: (id: string) => api.get(`/disciplinary-calls/${id}`),
  create: (data: any) => api.post('/disciplinary-calls', data),
  update: (id: string, data: any) => api.put(`/disciplinary-calls/${id}`, data),
  approve: (id: string, resolution: string) => api.post(`/disciplinary-calls/${id}/approve`, { resolution }),
  reject: (id: string, resolution: string) => api.post(`/disciplinary-calls/${id}/reject`, { resolution }),
};
