// Shapes mirror the NestJS backend (salon-booking-api).

export type UserRole = 'CUSTOMER' | 'SPECIALIST' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface SalonService {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  priceAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceInput {
  title: string;
  description?: string | null;
  durationMinutes: number;
  priceAmount: number;
}

/** GET /specialists (public list) */
export interface SpecialistListItem {
  id: string; // specialist profile id (used for booking)
  bio: string;
  yearsExperience: number;
  specialist: { id: string; fullName: string };
  services: { id: string; name: string; price: number; duration: number }[];
}

/** GET /specialists/me, GET /specialists/:id */
export interface SpecialistProfile {
  id: string;
  bio: string;
  yearsExperience: number;
  specialist: { id: string; fullName: string };
  services: { id: string; name: string }[];
}

/** GET /specialists/admin/all */
export interface AdminSpecialist {
  id: string;
  bio: string;
  yearsExperience: number;
  specialist: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
  services: { id: string; name: string; price: number }[];
}

export type DayOfWeek =
  | 'SATURDAY'
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY';

export interface WorkingHourInput {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  isWorking: boolean;
}

export interface WorkingHour extends WorkingHourInput {
  id: string;
  specialistId: string;
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Appointment {
  id: string;
  customerId: string;
  specialistId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

/** GET /appointments/my */
export interface CustomerAppointment extends Appointment {
  specialist: { id: string; bio: string; user: { fullName: string } };
  service: SalonService;
}

/** GET /appointments/specialist */
export interface SpecialistAppointment extends Appointment {
  customer: { id: string; fullName: string; email: string };
  service: SalonService;
}
