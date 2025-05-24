import { useState, useRef } from 'react';
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface SubjectForm {
  name: string;
  subject_code: string;
  nptel_course_code: string;
}

type subject = {
  subject_code: string;
  success: boolean;
  message: string;
}

type ApiResponse = {
  results: subject[]
}

const postSubjects = async (subjects: SubjectForm[]) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.post<ApiResponse>(
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

const CreateSubject = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [subjects, setSubjects] = useState<SubjectForm[]>([{
    name: '',
    subject_code: '',
    nptel_course_code : '',
  }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [apiCalled, setApiCalled] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorSubjects, setErrorSubjects] = useState<subject[]>([]);

  // React Query mutation for creating subjects
  const mutation = useMutation({
    mutationFn: postSubjects,
    onSuccess: (data) => {
      setApiCalled(true);
      setSuccessCount(0);
      setErrorSubjects([]);

      // Process response data
      data.results.forEach((subject) => {
        if (subject.success) {
          setSuccessCount(prev => prev + 1);
        } else {
          setErrorSubjects(prev => [...prev, subject]);
        }
      });

    
      setSubjects([{ name: '', subject_code: '' , nptel_course_code: ''}]);
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
      { name: '', subject_code: '', nptel_course_code: '' }
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
      subject.nptel_course_code.trim() !== ''
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
          // Only include name and subject_code fields
          if (header === 'name' || header === 'subject_code' || header=='nptel_course_code') {
            subject[header] = values[i];
          }
        });
        return subject;
      });
      setIsSubmitting(true);
      setError(null);
      mutation.mutate(subjectsFromCSV);
    };
    reader.readAsText(csvFile);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Create Subjects</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {apiCalled && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Successfully Created: </strong>
          <span className="block sm:inline">{successCount} subjects</span>
        </div>
      )}

      {mutation.isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Processing...</span>
        </div>
      )}

      {errorSubjects.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4 text-red-600">Failed Creations ({errorSubjects.length})</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error Message
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errorSubjects.map((subject, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {subject.subject_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {subject.message}
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
          CSV should include columns with headings as name ,subject_code and nptel_course_code
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NPTEL Course Code</label>
                <input
                  type="text"
                  value={subject.nptel_course_code}
                  onChange={(e) => handleChange(index, 'nptel_course_code', e.target.value)}
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
