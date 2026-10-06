// API Service with Fetch
import type {
  AdminStats,
  ApiSessionUser,
  AttendanceItem,
  AuthResponse,
  ClassItem,
  ClassPayload,
  ClassReport,
  CreateAttendancePayload,
  CreateDisciplinaryCallPayload,
  CreateGradePayload,
  CreatePendingWorkPayload,
  CreateUserPayload,
  DashboardStats,
  DisciplinaryCall,
  GradeItem,
  PagedResult,
  PendingWorkItem,
  School,
  SchoolPayload,
  StudentItem,
  StudentPayload,
  UpdateAttendancePayload,
  UpdateGradePayload,
  UpdateUserPayload,
  UserFilters,
  UserListItem,
} from '../types';

// Sem VITE_API_URL, usa a porta padrão da EscolaSystem API em desenvolvimento (launchSettings: 5130)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5130/api';

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions extends RequestInit {
  params?: Record<string, QueryValue>;
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

  private buildUrl(endpoint: string, params?: Record<string, QueryValue>): string {
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

    async request<T = unknown>(
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
        // 401 no próprio login é "credenciais inválidas": a tela de login mostra a mensagem.
        // No logout o token já está saindo. Nas demais, só redireciona se havia sessão (expirou ou foi invalidada).
        if (response.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/logout')) {
          const hadSession = this.token !== null;
          this.clearToken();
          if (hadSession && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        
                // Erros da API trazem { error, message }; sem corpo legível, fica o status
        const body: { message?: string } = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(body.message || `HTTP Error: ${response.status}`);
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

  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

    async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

    async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

    async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();

type Paged<T> = Promise<PagedResult<T>>;

export const authApi = {
  login: (email: string, password: string) => api.post<AuthResponse>('/auth/login', { email, password }),
  logout: () => api.post<void>('/auth/logout'),
  resetPassword: (email: string, newPassword: string) => api.post<void>('/auth/reset-password', { email, newPassword }),
  me: () => api.get<ApiSessionUser>('/auth/me'),
};

export const schoolApi = {
  list: (page = 1, pageSize = 20): Paged<School> => api.get('/schools', { params: { page, pageSize } }),
  create: (data: SchoolPayload) => api.post<School>('/schools', data),
  update: (id: string, data: SchoolPayload) => api.put<School>(`/schools/${id}`, data),
  delete: (id: string) => api.delete<void>(`/schools/${id}`),
};

export const userApi = {
  list: (page = 1, pageSize = 20, filters: UserFilters = {}): Paged<UserListItem> =>
    api.get('/users', { params: { page, pageSize, ...filters } }),
  create: (data: CreateUserPayload) => api.post<UserListItem>('/users', data),
  update: (id: string, data: UpdateUserPayload) => api.put<UserListItem>(`/users/${id}`, data),
  /** Desativa a conta (a API preserva o histórico) */
  delete: (id: string) => api.delete<void>(`/users/${id}`),
  assignClass: (teacherId: string, classId: string) => api.post<void>(`/users/${teacherId}/assign-class/${classId}`),
  unassignClass: (teacherId: string, classId: string) => api.delete<void>(`/users/${teacherId}/assign-class/${classId}`),
  assignStudent: (parentId: string, studentId: string) => api.post<void>(`/users/${parentId}/assign-student/${studentId}`),
  unassignStudent: (parentId: string, studentId: string) => api.delete<void>(`/users/${parentId}/assign-student/${studentId}`),
  assignOrientadorClass: (orientadorId: string, classId: string) => api.post<void>(`/users/${orientadorId}/assign-orientador-class/${classId}`),
  unassignOrientadorClass: (orientadorId: string, classId: string) =>
    api.delete<void>(`/users/${orientadorId}/assign-orientador-class/${classId}`),
};

export const classApi = {
  list: (page = 1, pageSize = 50, schoolId?: string): Paged<ClassItem> => api.get('/classes', { params: { page, pageSize, schoolId } }),
  create: (data: ClassPayload) => api.post<ClassItem>('/classes', data),
  update: (id: string, data: ClassPayload) => api.put<ClassItem>(`/classes/${id}`, data),
  delete: (id: string) => api.delete<void>(`/classes/${id}`),
};

export const studentApi = {
  // isActive: true deixa de fora alunos desativados (transferidos), que não entram em chamada nem lançamento
  list: (page = 1, pageSize = 50, classId?: string, schoolId?: string, isActive?: boolean): Paged<StudentItem> =>
    api.get('/students', { params: { page, pageSize, classId, schoolId, isActive } }),
  create: (data: StudentPayload) => api.post<StudentItem>('/students', data),
  update: (id: string, data: StudentPayload) => api.put<StudentItem>(`/students/${id}`, data),
  delete: (id: string) => api.delete<void>(`/students/${id}`),
};

export const gradeApi = {
  list: (page = 1, pageSize = 200, classId?: string, studentId?: string): Paged<GradeItem> =>
    api.get('/grades', { params: { page, pageSize, classId, studentId } }),
  create: (data: CreateGradePayload) => api.post<GradeItem>('/grades', data),
  update: (id: string, data: UpdateGradePayload) => api.put<GradeItem>(`/grades/${id}`, data),
  delete: (id: string) => api.delete<void>(`/grades/${id}`),
};

export const attendanceApi = {
  list: (page = 1, pageSize = 500, classId?: string, studentId?: string, date?: string): Paged<AttendanceItem> =>
    api.get('/attendance', { params: { page, pageSize, classId, studentId, date } }),
  update: (id: string, data: UpdateAttendancePayload) => api.put<AttendanceItem>(`/attendance/${id}`, data),
  bulkCreate: (data: CreateAttendancePayload[]) => api.post<AttendanceItem[]>('/attendance/bulk', data),
};

export const pendingWorkApi = {
  list: (page = 1, pageSize = 100, classId?: string): Paged<PendingWorkItem> => api.get('/pending-works', { params: { page, pageSize, classId } }),
  create: (data: CreatePendingWorkPayload) => api.post<PendingWorkItem>('/pending-works', data),
  markDelivered: (id: string) => api.put<PendingWorkItem>(`/pending-works/${id}/delivered`),
};

// Números calculados pela API, no escopo do usuário logado
export const dashboardApi = {
  adminStats: () => api.get<AdminStats>('/admin/stats'),
  stats: () => api.get<DashboardStats>('/dashboard/stats'),
};

export const reportApi = {
  classes: (schoolId?: string) => api.get<ClassReport[]>('/reports/classes', { params: { schoolId } }),
};

export const disciplinaryApi = {
  // page/pageSize opcionais: sem eles a API devolve só os 20 primeiros
  list: (schoolId?: string, studentId?: string, status?: string, page?: number, pageSize?: number): Paged<DisciplinaryCall> =>
    api.get('/disciplinary-calls', { params: { schoolId, studentId, status, page, pageSize } }),
  create: (data: CreateDisciplinaryCallPayload) => api.post<DisciplinaryCall>('/disciplinary-calls', data),
  approve: (id: string, resolution: string) => api.post<DisciplinaryCall>(`/disciplinary-calls/${id}/approve`, { resolution }),
  reject: (id: string, resolution: string) => api.post<DisciplinaryCall>(`/disciplinary-calls/${id}/reject`, { resolution }),
};
