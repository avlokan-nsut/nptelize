import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from 'react-toastify';

interface StudentForm {
  name: string;
  email: string;
  password: string;
  roll_number: string;
}

type student = {
  "email" : string;
  "success" : boolean;
  "message" : string;
}

type ApiResponse = {
  results : student[]
}

const postStudents = async (students: StudentForm[]) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.post<ApiResponse>(
    `${apiUrl}/admin/create/students`,
    students,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

const CreateStudent = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [students, setStudents] = useState<StudentForm[]>([
    {
      name: "",
      email: "",
      password: "",
      roll_number: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiCalled, setApiCalled] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorStudents, setErrorStudents] = useState<student[]>([]);

  // React Query mutation for creating students
  const mutation = useMutation({
  mutationFn: postStudents,
  onSuccess: (data) => {
    setApiCalled(true);
    
    // Use local variables instead of immediate state updates
    let localSuccessCount = 0;
    let failedStudents:student[] = [];

    // Process response data
    data.results.forEach((student) => {
      if (student.success) {
        localSuccessCount += 1;
      } else {
        failedStudents.push(student);
      }
    });

    // Update state with final counts
    setSuccessCount(localSuccessCount);
    setErrorStudents(failedStudents);

    // Use local variable for toast (this will work correctly)
    if (localSuccessCount > 0) {
      toast.success(`Successfully created ${localSuccessCount} students`);
    }
    
    setStudents([{ name: "", email: "", password: "", roll_number: "" }]);
    setIsSubmitting(false);
  },
  onError: () => {
    toast.error("Failed to create students");
    setIsSubmitting(false);
  },
});


  // CSV file upload

  const handleCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvFile(e.target.files?.[0] || null);
  };

  const handleCSVUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map((h) => h.trim());
      const studentsFromCSV = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const student: any = {};
        headers.forEach((header, i) => {
          student[header] = values[i];
           let value = values[i] || "";
                if (header === "email") {
                    value = value.toLowerCase();
                }
                student[header] = value;
        });
        return student;
      });
      setIsSubmitting(true);
      mutation.mutate(studentsFromCSV);
    };
    reader.readAsText(csvFile);
  };

  // Handlers for adding/removing students

  const handleAddStudent = () => {
    setStudents([
      ...students,
      { name: "", email: "", password: "", roll_number: "" },
    ]);
  };

  const handleRemoveStudent = (index: number) => {
    const updatedStudents = students.filter((_, i) => i !== index);
    setStudents(updatedStudents);
  };

  const handleChange = (
    index: number,
    field: keyof StudentForm,
    value: string
  ) => {
    const updatedStudents = [...students];
    if(field === "email") {
      value = value.toLowerCase();
    }
    updatedStudents[index] = {
      ...updatedStudents[index],
      [field]: value,
    };
    setStudents(updatedStudents);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const isValid = students.every(
      (student) =>
        student.name.trim() !== "" &&
        student.email.trim() !== "" &&
        student.password.trim() !== "" &&
        student.roll_number.trim() !== ""
    );

    if (!isValid) {
      toast.error("Please fill in all fields for each student.");
      return;
    }

    setIsSubmitting(true);
    mutation.mutate(students);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create Students</h2>

      {apiCalled && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Successfully Created: </strong>
          <span className="block sm:inline">{successCount} students</span>
        </div>
      )}

      {mutation.isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Processing...</span>
        </div>
      )}

      {errorStudents.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4 text-red-600">Failed Creations ({errorStudents.length})</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errorStudents.map((student, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {student.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV Upload Section */}

      <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Import Students via CSV</h3>

        <form
          onSubmit={handleCSVUpload}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVChange}
            ref={fileInputRef}
            style={{ display: "none" }}
            className="file-input file-input-neutral"
          />

          <button
            type="button"
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => fileInputRef.current?.click()}
          >
            Select CSV File
          </button>

          {csvFile ? (
            <div className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-600 truncate max-w-xs">
              {csvFile.name}
            </div>
          ) : (
            <div className="flex-1 px-3 py-2 bg-white border border-dashed border-gray-300 rounded-md text-sm text-gray-400">
              No file selected
            </div>
          )}

          <button
            type="submit"
            disabled={!csvFile}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              !isSubmitting
                ? "btn btn-neutral hover:bg-gray-800"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Creating..." : "Create Students"}
          </button>
        </form>

        <p className="mt-3 text-xs text-gray-500">
          CSV should include columns with headings as name, email, password, and
          roll_number
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {students.map((student, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Student {index + 1}</h3>
              {students.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStudent(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={student.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={student.email}
                  onChange={(e) => handleChange(index, "email", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={student.password}
                  onChange={(e) =>
                    handleChange(index, "password", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={student.roll_number}
                  onChange={(e) =>
                    handleChange(index, "roll_number", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={handleAddStudent}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            + Add Another Student
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Creating..." : "Create Students"}
          </button>
        </div>
      </form>
    </div>
  );
};



export default CreateStudent;
