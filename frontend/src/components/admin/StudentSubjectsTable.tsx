import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import { TenureSelector } from '../ui/DropDown';
import TableSkeleton from '../ui/TableSkeleton';

interface Subject {
  id: string;
  name: string;
  subject_code: string;
  teacher_id: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  employee_id: string;
}

interface StudentSubjectsTableProps {
  studentId: string;
  studentName?: string;
}

const StudentSubjectsTable = ({ studentId, studentName }: StudentSubjectsTableProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

   const { tenure } = useAuthStore();
      const year = tenure?.year;
      const sem = tenure?.is_even;

  const fetchData = async () => {
    if (!studentId) {
      setError('Student ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;
      
      // Fetch student subjects and teachers in parallel
      const [subjectsResponse, teachersResponse] = await Promise.all([
        axios.get(`${apiUrl}/admin/get/student-subjects/${studentId}`, {
          withCredentials: true,
          params:{year,sem}
        }),
        axios.get(`${apiUrl}/admin/get/teachers`, { 
          withCredentials: true 
        })
      ]);
      
      setSubjects(subjectsResponse.data.subjects);
      setTeachers(teachersResponse.data.teachers);
      setError(null);
    } catch (err) {
      setError('Failed to fetch subjects for this student');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId,year,sem]);

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };
  const handleDeleteSubject = async (subjectId: string) => {
    if (!studentId || !subjectId) return;
    
    try {
      setDeleteLoading(subjectId);
      const apiUrl = import.meta.env.VITE_API_URL;
      
      await axios.delete(`${apiUrl}/admin/delete/student-subject`, {
        params: {
          student_id: studentId,
          subject_id: subjectId,
          year,
          sem
        },
        withCredentials: true
      });
      setSubjects(prevSubjects => prevSubjects.filter(subject => subject.id !== subjectId));
      
    } catch (err) {
      console.error('Failed to delete subject:', err);
      setError('Failed to remove subject from student');
    } finally {
      setDeleteLoading(null);
    }
  };


  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          className="mt-2 bg-red-200 text-red-800 px-3 py-1 rounded-md hover:bg-red-300"
          onClick={() => {
            setError(null);
            fetchData();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        {studentName ? `Subjects Enrolled by ${studentName}` : 'Student Subjects'}
      </h2>

      <div className="flex justify-center md:justify-end mb-6 max-w-7xl mx-auto">
                    <TenureSelector />
        </div>

      {loading ? (
        <TableSkeleton rows={5} cols={7} className="max-w-7xl mx-auto" />
      ):subjects && (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {subjects.length > 0 ? (
              subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.subject_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTeacherName(subject.teacher_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => handleDeleteSubject(subject.id)}
                      disabled={deleteLoading === subject.id}
                      className={`text-red-600 hover:text-red-800 text-sm font-medium ${deleteLoading === subject.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {deleteLoading === subject.id ? 'Removing...' : 'Remove Subject'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No subjects found for this student
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>)}
    </div>
  );
};

export default StudentSubjectsTable;
