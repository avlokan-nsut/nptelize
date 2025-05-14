import { z } from "zod";

export const requestSchema = z.object({
  subjectCode: z.string().min(1, "Subject code is required"),
  subjectName: z.string().min(1, "Subject name is required"),
  dueDate: z.string().min(1, "Due date is required"),
  file: z.instanceof(File, { message: "CSV file is required" }),
});

export type RequestFormData = z.infer<typeof requestSchema>;
