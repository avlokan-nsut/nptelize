import { useState, useEffect } from 'react';
import axios from 'axios';

interface Student {
  id: string;
  name: string;
  email: string;
  roll_number: string;
}

interface SubjectStudentsTableProps {
  subjectId: string;
  subjectName?: string;
}

const SubjectStudentsTable = ({ subjectId, subjectName }: SubjectStudentsTableProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjectStudents = async () => {
      if (!subjectId) {
        setError('Subject ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/admin/get/subject-students/${subjectId}`, {
          withCredentials: true,
        });
        setStudents(response.data.students);
        setError(null);
      } catch (err) {
        setError('Failed to fetch students for this subject');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectStudents();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        {subjectName ? `Students Enrolled in ${subjectName}` : 'Subject Students'}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.length > 0 ? (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.roll_number}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No students enrolled in this subject
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubjectStudentsTable;
