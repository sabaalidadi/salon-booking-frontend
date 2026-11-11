import { api } from './client';
import type {
  AdminSpecialist,
  AllReviewsPage,
  Category,
  Appointment,
  AppointmentStatus,
  Availability,
  ReviewsPage,
  CustomerAppointment,
  SalonService,
  ServiceInput,
  SpecialistAppointment,
  SpecialistListItem,
  SpecialistProfile,
  User,
  UserRole,
  WorkingHour,
  WorkingHourInput,
} from './types';

type AuthResult = { message: string; user: User };

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResult>('/auth/login', { email, password }),
  register: (fullName: string, email: string, password: string) =>
    api.post<AuthResult>('/auth/register', { fullName, email, password }),
  refresh: () => api.post<AuthResult>('/auth/refresh'),
  logout: () => api.post<{ message: string }>('/auth/logout'),
};

export const usersApi = {
  me: () => api.get<User>('/users/me'),
  updateMe: (fullName: string) => api.patch<User>('/users/me', { fullName }),
  list: () => api.get<User[]>('/users'),
  changeRole: (id: string, role: UserRole) =>
    api.patch<User>(`/users/${id}/role`, { role }),
};

export const servicesApi = {
  list: () => api.get<SalonService[]>('/services'),
  get: (id: string) => api.get<SalonService>(`/services/${id}`),
  create: (dto: ServiceInput) => api.post<SalonService>('/services', dto),
  update: (id: string, dto: Partial<ServiceInput>) =>
    api.patch<SalonService>(`/services/${id}`, dto),
  remove: (id: string) => api.delete<void>(`/services/${id}`),
  uploadImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.put<SalonService>(`/services/${id}/image`, fd);
  },
  removeImage: (id: string) => api.delete<SalonService>(`/services/${id}/image`),
};

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (dto: { label: string; icon?: string | null }) => api.post<Category>('/categories', dto),
  update: (id: string, dto: { label?: string; icon?: string | null }) =>
    api.patch<Category>(`/categories/${id}`, dto),
  remove: (id: string) => api.delete<void>(`/categories/${id}`),
};

export const specialistsApi = {
  list: () => api.get<SpecialistListItem[]>('/specialists'),
  get: (id: string) => api.get<SpecialistProfile>(`/specialists/${id}`),
  workingHours: (id: string) =>
    api.get<WorkingHour[]>(`/specialists/${id}/working-hours`),

  mine: () => api.get<SpecialistProfile>('/specialists/me'),
  createMine: (dto: { bio: string; yearsExperience: number }) =>
    api.post<SpecialistProfile>('/specialists/me', dto),
  updateMine: (dto: { bio?: string; yearsExperience?: number }) =>
    api.patch<SpecialistProfile>('/specialists/me', dto),
  setMyWorkingHours: (schedule: WorkingHourInput[]) =>
    api.put<WorkingHour[]>('/specialists/me/working-hours', { schedule }),

  availability: (id: string, date: string, serviceId: string) =>
    api.get<Availability>(`/specialists/${id}/availability?date=${date}&serviceId=${serviceId}`),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.put<SpecialistProfile>('/specialists/me/avatar', fd);
  },
  removeAvatar: () => api.delete<SpecialistProfile>('/specialists/me/avatar'),

  adminList: () => api.get<AdminSpecialist[]>('/specialists/admin/all'),
  setServices: (id: string, serviceIds: string[]) =>
    api.put<SpecialistProfile>(`/specialists/${id}/services`, { serviceIds }),
};

export const appointmentsApi = {
  create: (dto: { specialistId: string; serviceId: string; startTime: string }) =>
    api.post<Appointment>('/appointments', dto),
  mine: () => api.get<CustomerAppointment[]>('/appointments/my'),
  forSpecialist: () =>
    api.get<SpecialistAppointment[]>('/appointments/specialist'),
  setStatus: (id: string, status: AppointmentStatus) =>
    api.patch<Appointment>(`/appointments/${id}/status`, { status }),
  cancel: (id: string) =>
    api.patch<{ id: string; status: AppointmentStatus }>(`/appointments/${id}/cancel`),
  reschedule: (id: string, startTime: string) =>
    api.patch<Appointment>(`/appointments/${id}/reschedule`, { startTime }),
};

export const reviewsApi = {
  create: (dto: { appointmentId: string; rating: number; comment?: string }) =>
    api.post<{ id: string; rating: number }>('/reviews', dto),
  all: (page = 1, limit = 10) =>
    api.get<AllReviewsPage>(`/reviews?page=${page}&limit=${limit}`),
  forSpecialist: (id: string, page = 1, limit = 10) =>
    api.get<ReviewsPage>(`/specialists/${id}/reviews?page=${page}&limit=${limit}`),
};
