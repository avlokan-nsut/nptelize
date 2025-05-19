import { useState, useRef } from 'react';
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface TeacherForm {
  name: string;
  email: string;
  password: string;
  employee_id: string;
}

const postTeachers = async (teachers: TeacherForm[]) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.post(
    `${apiUrl}/admin/create/teachers`,
    teachers,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

const CreateFaculty = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [teachers, setTeachers] = useState<TeacherForm[]>([{
    name: '',
    email: '',
    password: '',
    employee_id: ''
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // React Query mutation for creating faculty
  const mutation = useMutation({
    mutationFn: postTeachers,
    onSuccess: () => {
      setSuccessMessage(`Successfully created faculty members`);
      setTeachers([{ name: '', email: '', password: '', employee_id: '' }]);
      setIsSubmitting(false);
    },
    onError: () => {
      setError("Failed to create faculty members");
      setIsSubmitting(false);
    },
  });

  const handleAddTeacher = () => {
    setTeachers([
      ...teachers,
      { name: '', email: '', password: '', employee_id: '' }
    ]);
  };

  const handleRemoveTeacher = (index: number) => {
    const updatedTeachers = teachers.filter((_, i) => i !== index);
    setTeachers(updatedTeachers);
  };

  const handleChange = (index: number, field: keyof TeacherForm, value: string) => {
    const updatedTeachers = [...teachers];
    updatedTeachers[index] = {
      ...updatedTeachers[index],
      [field]: value
    };
    setTeachers(updatedTeachers);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isValid = teachers.every(teacher => 
      teacher.name.trim() !== '' && 
      teacher.email.trim() !== '' && 
      teacher.password.trim() !== '' && 
      teacher.employee_id.trim() !== ''
    );
    
    if (!isValid) {
      setError('Please fill in all fields for each faculty member.');
      return;
    }

    // Form submission
    setIsSubmitting(true);
    setError(null);
    
    mutation.mutate(teachers);
  };

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
      const teachersFromCSV = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const teacher: any = {};
        headers.forEach((header, i) => {
          teacher[header] = values[i];
        });
        console.log(teacher);
        return teacher;
      });
      setIsSubmitting(true);
      mutation.mutate(teachersFromCSV);
    };
    reader.readAsText(csvFile);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create Faculty</h2>
      
      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-600 rounded">
          {error}
        </div>
      )}

      {/* CSV Upload Section */}
      <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Import Faculty via CSV</h3>

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
            {isSubmitting ? "Creating..." : "Create Faculty"}
          </button>
        </form>

        <p className="mt-3 text-xs text-gray-500">
          CSV should include columns with headings as name, email, password, and
          employee_id
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {teachers.map((teacher, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Faculty Member {index + 1}</h3>
              {teachers.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveTeacher(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={teacher.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={teacher.email}
                  onChange={(e) => handleChange(index, 'email', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={teacher.password}
                  onChange={(e) => handleChange(index, 'password', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={teacher.employee_id}
                  onChange={(e) => handleChange(index, 'employee_id', e.target.value)}
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
            onClick={handleAddTeacher}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            + Add Another Faculty
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Faculty'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFaculty;
