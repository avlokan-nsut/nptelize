export type Teacher = {
  id: string;
  name: string;
};

export type Subject = {
  id: string;
  code: string;
  name: string;
  teacher: Teacher;
};

export type Request = {
  request_id: string;
  subject: Subject;
  status: string;
  due_date: string;
};

export type ApiResponse = {
  requests: Request[];
};