export interface StudentForm {
  name: string;
  email: string;
  password: string;
  roll_number: string;
}

export interface TeacherForm {
  name: string;
  email: string;
  password: string;
  employee_id: string;
}

export interface AdminForm {
  name: string;
  email: string;
  password: string;
  employee_id: string;
}

export interface SubjectForm {
  name: string;
  subject_code: string;
  teacher_id: string;
}

export interface ApiResponse {
  results: Array<{
    email?: string;
    subject_code?: string;
    success: boolean;
    message: string;
  }>;
}
