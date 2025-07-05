export type Subject = {
  id: string;
  name: string;
  subject_code: string;
  teacher_id: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
  roll_number: string;
};


export type CertificateDetails = {
  uploaded_certificate: {
    student_name: string;
    roll_no: string;
    marks: string;
    course_name: string;
    course_period: string;
    file_url: string;
  };
  verification_certificate: {
    student_name: string;
    roll_no: string;
    marks: string;
    course_name: string;
    course_period: string;
    file_url: string;
  };
  subject_name: string;
  remark: string;
};

export type CertificateApiResponse = {
  message: string;
  data: CertificateDetails;
};

export type RejectedRequestWithDetails = {
  id: string;
  student: Student;
  subject: Subject;
  status: "rejected";
  verified_total_marks: string;
  created_at: string;
  due_date: string;
  certificate_details: CertificateDetails | null;
};