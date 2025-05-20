import { useState } from 'react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';

interface EnrollmentData {
  email: string;
  subject_code: string;
}

interface EnrollStudentsProps {
  onSuccess?: () => void;
}

const EnrollStudents = ({ onSuccess }: EnrollStudentsProps) => {
  const [email, setEmail] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: EnrollmentData[]) => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/admin/add/students`, data, {
        withCredentials: true,
      });
      return response.data;
    },    onSuccess: () => {
      setSuccess('Students enrolled successfully');
      setEmail('');
      setSubjectCode('');
      setCsvFile(null);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to enroll students');
      console.error('Enrollment error:', error);
    },
  });
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !subjectCode) {
      setError('Please fill all required fields');
      return;
    }

    const data: EnrollmentData[] = [
      {
        email,
        subject_code: subjectCode,
      },
    ];

    setError(null);
    mutation.mutate(data);
  };

  const handleCSVUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {        const text = event.target?.result as string;
        const lines = text.split('\n').filter(Boolean);
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const requiredHeaders = ['email', 'subject_code'];
        const missingHeaders = requiredHeaders.filter(
          (header) => !headers.includes(header)
        );

        if (missingHeaders.length > 0) {
          setError(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        const dataFromCSV = lines.slice(1).map((line) => {
          const values = line.split(',').map((v) => v.trim());
          const item: any = {};
          headers.forEach((header, i) => {
            item[header] = values[i];
          });
          return item as EnrollmentData;
        });

        if (dataFromCSV.length === 0) {
          setError('CSV file has no data rows');
          return;
        }

        setError(null);
        mutation.mutate(dataFromCSV);
      } catch (error: any) {
        setError(`Error parsing CSV: ${error.message}`);
      }
    };

    reader.onerror = () => {
      setError('Error reading the CSV file');
    };

    reader.readAsText(csvFile);
  };

  return (
    <div className="my-6">
      <h2 className="text-xl font-semibold mb-4">Enroll Students in Subjects</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {mutation.isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Processing...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Single Enrollment</h3>
          <form onSubmit={handleSingleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                Student Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="student@example.com"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="subjectCode" className="block text-gray-700 font-medium mb-2">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subjectCode"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. CS101"
                required              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              Enroll Student
            </button>
          </form>
        </div>

        {/* CSV Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium mb-4">Bulk Enrollment via CSV</h3>
          <form onSubmit={handleCSVUpload}>
            <div className="mb-4">
              <label htmlFor="csvFile" className="block text-gray-700 font-medium mb-2">
                CSV File <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"                required
              />
              <p className="mt-1 text-sm text-gray-500">
                CSV must include headers: email, subject_code
              </p>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending || !csvFile}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              Upload & Process
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnrollStudents;
