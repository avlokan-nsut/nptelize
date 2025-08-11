import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Pagination from '../faculty/Pagination';
import SearchBar from '../faculty/SearchBar';
import { useAuthStore } from '../../store/useAuthStore';
import TableSkeleton from '../ui/TableSkeleton';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { tenure } = useAuthStore();
    const year = tenure?.year;
    const sem = tenure?.is_even;

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
          params:{year,sem}
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
  }, [subjectId,year,sem]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Calculate paginated data and total pages
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


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
      
      <div className="mb-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search students..."
        />
      </div>

    {loading ? (
        <TableSkeleton rows={5} cols={7} className="max-w-7xl mx-auto" />
      ):paginatedStudents && (
      
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
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.roll_number}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'No students found matching your search' : 'No students enrolled in this subject'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>)}

      {/* Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        totalItems={filteredStudents.length}
      />
    </div>
  );
};

export default SubjectStudentsTable;