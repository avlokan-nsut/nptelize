import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import SubjectStudentsTable from "./SubjectStudentsTable";
import Pagination from "../faculty/Pagination";
import SearchBar from "../faculty/SearchBar";
import { useAuthStore } from "../../store/useAuthStore";
import { TenureSelector } from "../ui/DropDown";
import TableSkeleton from "../ui/TableSkeleton";

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

const SubjectTable = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(
        null
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");

    const { tenure } = useAuthStore();
        const year = tenure?.year;
        const sem = tenure?.is_odd;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const apiUrl = import.meta.env.VITE_API_URL;

                const [subjectsResponse, teachersResponse] = await Promise.all([
                    axios.get(`${apiUrl}/admin/get/session-subjects`, {
                        withCredentials: true,
                        params:{year,sem}
                    }),
                    axios.get(`${apiUrl}/admin/get/teachers`, {
                        withCredentials: true,
                    }),
                ]);

                setSubjects(subjectsResponse.data.subjects);
                setTeachers(teachersResponse.data.teachers);
                setError(null);
            } catch (err) {
                setError("Failed to fetch data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year,sem]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredSubjects = useMemo(() => {
        return subjects.filter(
            (subject) =>
                subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                subject.subject_code
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
        );
    }, [subjects, searchTerm]);

    // Calculate paginated data and total pages
    const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

    const paginatedSubjects = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredSubjects.slice(startIndex, endIndex);
    }, [filteredSubjects, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const getTeacherName = (teacherId: string) => {
        const teacher = teachers.find((t) => t.id === teacherId);
        return teacher ? teacher.name : "Unknown";
    };

    

    if (error) {
        return (
            <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
            >
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Subject List</h2>
            <div className="flex justify-center md:justify-end mb-6 max-w-7xl mx-auto">
                <TenureSelector />
            </div>
            
            {loading ? (
                <TableSkeleton rows={5} cols={7} className="max-w-7xl mx-auto" />
            ) : (
                <div>
                    {!selectedSubject && (
                        <div className="mb-4">
                            <SearchBar
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Search subjects..."
                            />
                        </div>
                    )}

                    {selectedSubject ? (
                        <div className="mb-6">
                            <button
                                onClick={() => setSelectedSubject(null)}
                                className="mb-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center"
                            >
                                <span className="mr-1">←</span> Back to subjects
                            </button>
                            <SubjectStudentsTable
                                subjectId={selectedSubject.id}
                                subjectName={selectedSubject.name}
                            />
                        </div>
                    ) : (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Course Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Course Code
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Assigned Faculty
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedSubjects.length > 0 ? (
                                            paginatedSubjects.map((subject) => (
                                                <tr
                                                    key={subject.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {subject.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {subject.subject_code}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {getTeacherName(
                                                            subject.teacher_id
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <button
                                                            onClick={() =>
                                                                setSelectedSubject(
                                                                    subject
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        >
                                                            View Students
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                                >
                                                    No subjects found
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
                                totalItems={filteredSubjects.length}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SubjectTable;
