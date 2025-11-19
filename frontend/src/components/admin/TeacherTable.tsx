import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Pagination from '../faculty/Pagination';

interface Teacher {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  isCoordinator?: boolean;
}

const TeacherTable = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/admin/get/teachers`, {
          withCredentials: true,
        });
        
        const teachersWithRoles = await Promise.all(
          response.data.teachers.map(async (teacher: Teacher) => {
            try {
              const roleResponse = await axios.get(
                `${apiUrl}/admin/get/user-role?email=${encodeURIComponent(teacher.email)}`,
                { withCredentials: true }
              );
              const isCoordinator = roleResponse.data.custom_roles?.some(
                (role: any) => role.module_name === 'nptel' && role.name === 'coordinator'
              );
              return { ...teacher, isCoordinator };
            } catch {
              return { ...teacher, isCoordinator: false };
            }
          })
        );
        
        setTeachers(teachersWithRoles);
        setError(null);
      } catch (err) {
        setError('Failed to fetch faculty data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const handleCoordinatorToggle = async (email: string, isCurrentlyCoordinator: boolean) => {
    setProcessingEmails(prev => new Set(prev).add(email));
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.post(
        `${apiUrl}/admin/modify/custom-role`,
        {
          email,
          module_name: 'nptel',
          role_name: 'coordinator',
          action: isCurrentlyCoordinator ? 'remove' : 'add'
        },
        { withCredentials: true }
      );
      
      setTeachers(prev =>
        prev.map(teacher =>
          teacher.email === email
            ? { ...teacher, isCoordinator: !isCurrentlyCoordinator }
            : teacher
        )
      );
    } catch (err) {
      console.error('Failed to modify coordinator role', err);
      alert('Failed to modify coordinator role');
    } finally {
      setProcessingEmails(prev => {
        const next = new Set(prev);
        next.delete(email);
        return next;
      });
    }
  };

  // Calculate paginated data and total pages
  const totalPages = Math.ceil(teachers.length / itemsPerPage);
  
  const paginatedTeachers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return teachers.slice(startIndex, endIndex);
  }, [teachers, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
      <h2 className="text-xl font-semibold mb-4">Faculty List</h2>
      <div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTeachers.length > 0 ? (
                paginatedTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.employee_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleCoordinatorToggle(teacher.email, teacher.isCoordinator || false)}
                        disabled={processingEmails.has(teacher.email)}
                        className={`px-4 py-2 rounded font-medium ${
                          teacher.isCoordinator
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {processingEmails.has(teacher.email)
                          ? 'Processing...'
                          : teacher.isCoordinator
                          ? 'Remove Coordinator'
                          : 'Create Coordinator'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No faculty members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={teachers.length}
        />
      </div>
    </div>
  );
};

export default TeacherTable;