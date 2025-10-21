export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'manager' | 'user';
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: number;
  role_name: string;
  description: string;
  can_access_web: boolean;
  can_access_api: boolean;
  created_at: Date;
}

export interface ApiKey {
  id: number;
  user_id: number;
  key_name: string;
  api_key: string;
  expires_at?: Date;
  created_at: Date;
  is_active: boolean;
}

export interface BydayaEvent {
  id: number;
  name: string;
  location?: string;
  email_subject: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BydayaEventItem {
  id: number;
  event_id: number;
  student_id: string;
  student_name: string;
  student_email: string;
  student_email_parent_1: string;
  student_email_parent_2?: string;
  number_of_seats: number;
  invitees?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BydayaEventInvitee {
  id: number;
  event_id: number;
  student_item_id: number;
  invitees_name: string;
  invitees_qrcode_text?: string;
  invitees_attendance: boolean;
  invitees_attendance_time?: Date;
  main_invitee: boolean;
  mail_send: boolean;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequest {
  db: string;
  login: string;
  password: string;
}

export interface LoginResponse {
  message: { apikey: string }[];
  success: boolean;
}

export interface GetDataRequest {
  invitees_qrcode_text: string;
}

export interface GetDataResponse {
  message: {
    main_invitee: boolean;
    number_of_seats: number;
    invitees_qrcode_text: string;
    invitees_name: string;
    invitees_attendance: boolean;
    invitees_attendance_time: string | null;
  }[];
  success: boolean;
}

export interface UpdateDataRequest {
  invitees: {
    invitees_name: string;
    invitees_attendance: boolean;
    invitees_qrcode_text: string;
  }[];
}

export interface ApiResponse<T = any> {
  message: T;
  success: boolean;
}

export interface EmailSendResult {
  success: boolean;
  sent: number;
  failed: number;
  message?: string;
}

export interface EmailStatistics {
  total_invitees: number;
  emails_sent: number;
  emails_pending: number;
  last_sent: Date | null;
}

export interface DetailedEmailReport {
  event_name: string;
  students_with_emails_sent: {
    invitees_name: string;
    student_name: string;
    student_email: string;
    mail_sent_at: Date;
  }[];
  students_pending_emails: {
    invitees_name: string;
    student_name: string;
    student_email: string;
    status: string;
  }[];
  email_statistics: EmailStatistics;
}

export interface InviteesResponse {
  invitees: BydayaEventInvitee[];
  summary: {
    total_invitees: number;
    emails_sent: number;
    emails_pending: number;
    main_invitees: number;
  };
  filters: {
    studentId?: string;
    eventId?: string;
    emailSent?: string;
  };
  success: boolean;
}