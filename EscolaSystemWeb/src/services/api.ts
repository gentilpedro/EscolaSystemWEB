// API Service with Fetch
import type {
  AdminStats,
  AssignmentPayload,
  ApiSessionUser,
  AttendanceItem,
  AuthResponse,
  ClassAssignment,
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
  SessionItem,
  AuditLogItem,
  TicketDetail,
  TicketFilters,
  TicketListItem,
  TicketStatus,
  TicketSummary,
  TicketType,
  SchoolOverview,
  SchoolSummary,
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

/** Cookie que a API emite no login; o valor volta no cabeçalho X-CSRF-Token (double submit). */
const CSRF_COOKIE = 'es_csrf';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
/** Rotas de sessão: um 401 delas não dispara a renovação automática. */
const SESSION_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find(c => c.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : undefined;
}

/** O cookie de CSRF vive o mesmo tempo que a sessão: sem ele, não há sessão para recuperar. */
export function hasSessionCookie(): boolean {
  return readCookie(CSRF_COOKIE) !== undefined;
}

/**
 * Cliente da API. A sessão mora em cookies httpOnly que o JavaScript não lê: as requisições vão com
 * `credentials: 'include'` e o navegador envia os cookies. Quando o token de acesso expira (401),
 * a sessão é renovada uma vez e a requisição é repetida.
 */
class ApiService {
  private baseURL: string;
  // Uma renovação por vez: requisições que recebem 401 juntas esperam a mesma
  private refreshing: Promise<boolean> | null = null;
  /** Chamado quando a sessão acabou de vez (renovação recusada). */
  onSessionExpired: (() => void) | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private buildUrl(endpoint: string, params?: Record<string, QueryValue>): string {
    const url = `${this.baseURL}${endpoint}`;
    if (!params) return url;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) query.append(key, String(value));
    }
    const qs = query.toString();
    return qs ? `${url}?${qs}` : url;
  }

  private headers(method: string): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const csrf = UNSAFE_METHODS.has(method) ? readCookie(CSRF_COOKIE) : undefined;
    if (csrf) headers['X-CSRF-Token'] = csrf;
    return headers;
  }

  /** Troca o refresh token por um par novo. 409 = outra aba renovou um instante antes: os cookies já são os novos. */
  private refreshSession(): Promise<boolean> {
    this.refreshing ??= fetch(this.buildUrl('/auth/refresh'), { method: 'POST', credentials: 'include', headers: this.headers('POST') })
      .then(r => r.ok || r.status === 409)
      .catch(() => false)
      .finally(() => {
        this.refreshing = null;
      });
    return this.refreshing;
  }

  async request<T = unknown>(endpoint: string, options?: RequestOptions, isRetry = false): Promise<T> {
    const { params, ...fetchOptions } = options || {};
    const method = (fetchOptions.method ?? 'GET').toUpperCase();

    try {
      const response = await fetch(this.buildUrl(endpoint, params), {
        ...fetchOptions,
        method,
        credentials: 'include',
        headers: this.headers(method),
      });

      if (!response.ok) {
        // 401 no login é "credenciais inválidas" e a tela mostra a mensagem; nas demais, o token de acesso
        // venceu ou a sessão foi encerrada: tenta renovar uma vez e repete
        if (response.status === 401 && !isRetry && !SESSION_ENDPOINTS.some(e => endpoint.startsWith(e))) {
          if (await this.refreshSession()) return this.request<T>(endpoint, options, true);
          this.onSessionExpired?.();
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

  get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });
  }

  put<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data === undefined ? undefined : JSON.stringify(data) });
  }

  patch<T = unknown>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: data === undefined ? undefined : JSON.stringify(data) });
  }

  delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiService();

type Paged<T> = Promise<PagedResult<T>>;

export const authApi = {
  login: (email: string, password: string) => api.post<AuthResponse>('/auth/login', { email, password }),
  logout: () => api.post<void>('/auth/logout'),
  /** Troca a própria senha; exige a senha atual e mantém só a sessão atual */
  changePassword: (currentPassword: string, newPassword: string) => api.post<void>('/auth/change-password', { currentPassword, newPassword }),
  /** Redefine a senha de outra pessoa (admin, ou diretor para a própria escola) */
  resetPassword: (email: string, newPassword: string) => api.post<void>('/auth/reset-password', { email, newPassword }),
  me: () => api.get<ApiSessionUser>('/auth/me'),
  /** Aparelhos conectados da própria conta, o atual primeiro */
  sessions: () => api.get<SessionItem[]>('/auth/sessions'),
  revokeSession: (id: string) => api.delete<void>(`/auth/sessions/${id}`),
  /** Sai de todos os outros aparelhos e mantém este */
  revokeOtherSessions: () => api.delete<void>('/auth/sessions'),
};

export const schoolApi = {
  list: (page = 1, pageSize = 20): Paged<School> => api.get('/schools', { params: { page, pageSize } }),
  get: (id: string) => api.get<School>(`/schools/${id}`),
  create: (data: SchoolPayload) => api.post<School>('/schools', data),
  update: (id: string, data: SchoolPayload) => api.put<School>(`/schools/${id}`, data),
  delete: (id: string) => api.delete<void>(`/schools/${id}`),
};

export const auditApi = {
  /** Registro de atividades do admin; from e to em ISO, to exclusivo */
  list: (page = 1, pageSize = 25, filters: { action?: string; from?: string; to?: string } = {}): Paged<AuditLogItem> =>
    api.get('/audit', { params: { page, pageSize, ...filters } }),
};

export const adminSchoolsApi = {
  /** Todas as escolas com os números para o painel (só admin) */
  overview: () => api.get<SchoolOverview[]>('/admin/schools/summary'),
  /** Uma escola: contato da direção e contagens (só admin) */
  summary: (id: string) => api.get<SchoolSummary>(`/admin/schools/${id}/summary`),
};

export const ticketApi = {
  /** Direção: os da própria escola; admin: todos */
  list: (page = 1, pageSize = 20, filters: TicketFilters = {}): Paged<TicketListItem> =>
    api.get('/tickets', { params: { page, pageSize, ...filters } }),
  get: (id: string) => api.get<TicketDetail>(`/tickets/${id}`),
  /** Só a direção abre */
  create: (data: { type: TicketType; title: string; description: string }) => api.post<TicketDetail>('/tickets', data),
  reply: (id: string, body: string) => api.post<TicketDetail>(`/tickets/${id}/messages`, { body }),
  /** Só o admin muda a situação */
  setStatus: (id: string, status: TicketStatus) => api.put<TicketDetail>(`/tickets/${id}/status`, { status }),
  summary: () => api.get<TicketSummary>('/tickets/summary'),
};

export const userApi = {
  list: (page = 1, pageSize = 20, filters: UserFilters = {}): Paged<UserListItem> =>
    api.get('/users', { params: { page, pageSize, ...filters } }),
  create: (data: CreateUserPayload) => api.post<UserListItem>('/users', data),
  update: (id: string, data: UpdateUserPayload) => api.put<UserListItem>(`/users/${id}`, data),
  /** Desativa a conta (a API preserva o histórico) */
  delete: (id: string) => api.delete<void>(`/users/${id}`),
  /** Desfaz o bloqueio por senha errada sem trocar a senha (admin) */
  unlock: (id: string) => api.post<void>(`/users/${id}/unlock`),
  /** Desconecta de todos os aparelhos sem trocar a senha (admin; administradores e diretores) */
  revokeSessions: (id: string) => api.delete<void>(`/users/${id}/sessions`),
  assignClass: (teacherId: string, classId: string) => api.post<void>(`/users/${teacherId}/assign-class/${classId}`),
  unassignClass: (teacherId: string, classId: string) => api.delete<void>(`/users/${teacherId}/assign-class/${classId}`),
  assignStudent: (parentId: string, studentId: string) => api.post<void>(`/users/${parentId}/assign-student/${studentId}`),
  unassignStudent: (parentId: string, studentId: string) => api.delete<void>(`/users/${parentId}/assign-student/${studentId}`),
  assignOrientadorClass: (orientadorId: string, classId: string) => api.post<void>(`/users/${orientadorId}/assign-orientador-class/${classId}`),
  unassignOrientadorClass: (orientadorId: string, classId: string) =>
    api.delete<void>(`/users/${orientadorId}/assign-orientador-class/${classId}`),
};

/** Pessoas da escola: professor, orientador e responsável podem estar em várias escolas. */
export const schoolMemberApi = {
  /** Pessoa já cadastrada (pelo e-mail) entra na escola, sem nova conta */
  add: (schoolId: string, email: string) => api.post<UserListItem>(`/schools/${schoolId}/members`, { email }),
  /** Sai da escola: os vínculos com ela, as turmas e os alunos dela são encerrados; o histórico fica */
  remove: (schoolId: string, userId: string) => api.delete<void>(`/schools/${schoolId}/members/${userId}`),
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
  /** Lança para todos os alunos ativos da turma numa gravação só */
  createForClass: (classId: string, data: AssignmentPayload) => api.post<ClassAssignment>('/pending-works/class', { classId, ...data }),
  /** Corrige o trabalho em todos os alunos; as entregas registradas continuam */
  updateAssignment: (assignmentId: string, data: AssignmentPayload) => api.put<ClassAssignment>(`/pending-works/assignments/${assignmentId}`, data),
  deleteAssignment: (assignmentId: string) => api.delete<void>(`/pending-works/assignments/${assignmentId}`),
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
