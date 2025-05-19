import { useState, useRef } from 'react';
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface SubjectForm {
  name: string;
  subject_code: string;
  teacher_id: string;
}

const postSubjects = async (subjects: SubjectForm[]) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.post(
    `${apiUrl}/admin/create/subjects`,
    subjects,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

// Mock teacher data
const mockTeachers = [
  { id: '1', name: 'Dr. John Smith', employee_id: 'EMP001' },
  { id: '2', name: 'Prof. Sarah Johnson', employee_id: 'EMP002' },
  { id: '3', name: 'Dr. Michael Brown', employee_id: 'EMP003' },
  { id: '4', name: 'Prof. Lisa Davis', employee_id: 'EMP004' },
  { id: '5', name: 'Dr. Robert Wilson', employee_id: 'EMP005' },
];

const CreateSubject = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [subjects, setSubjects] = useState<SubjectForm[]>([{
    name: '',
    subject_code: '',
    teacher_id: ''
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // React Query mutation for creating subjects
  const mutation = useMutation({
    mutationFn: postSubjects,
    onSuccess: () => {
      setSuccessMessage(`Successfully created subjects`);
      setSubjects([{ name: '', subject_code: '', teacher_id: '' }]);
      setIsSubmitting(false);
    },
    onError: () => {
      setError("Failed to create subjects");
      setIsSubmitting(false);
    },
  });

  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      { name: '', subject_code: '', teacher_id: '' }
    ]);
  };

  const handleRemoveSubject = (index: number) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
  };

  const handleChange = (index: number, field: keyof SubjectForm, value: string) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [field]: value
    };
    setSubjects(updatedSubjects);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const isValid = subjects.every(subject => 
      subject.name.trim() !== '' && 
      subject.subject_code.trim() !== '' && 
      subject.teacher_id.trim() !== ''
    );
    
    if (!isValid) {
      setError('Please fill in all fields for each subject.');
      return;
    }

    // Form submission
    setIsSubmitting(true);
    setError(null);
    
    mutation.mutate(subjects);
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
      const subjectsFromCSV = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const subject: any = {};
        headers.forEach((header, i) => {
          subject[header] = values[i];
        });
        console.log(subject);
        return subject;
      });
      setIsSubmitting(true);
      mutation.mutate(subjectsFromCSV);
    };
    reader.readAsText(csvFile);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create Subjects</h2>
      
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
        <h3 className="text-lg font-medium mb-4">Import Subjects via CSV</h3>

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
            {isSubmitting ? "Creating..." : "Create Subjects"}
          </button>
        </form>

        <p className="mt-3 text-xs text-gray-500">
          CSV should include columns with headings as name, subject_code, and
          teacher_id
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {subjects.map((subject, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Subject {index + 1}</h3>
              {subjects.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveSubject(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={subject.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={subject.subject_code}
                  onChange={(e) => handleChange(index, 'subject_code', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty</label>
                <select
                  value={subject.teacher_id}
                  onChange={(e) => handleChange(index, 'teacher_id', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select a faculty member</option>
                  {mockTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.employee_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={handleAddSubject}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            + Add Another Subject
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Subjects'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSubject;
