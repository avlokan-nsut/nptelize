import { FaArrowRight, FaChevronDown, FaCalendarAlt, FaPaperPlane, FaFileAlt, FaUserCheck } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "./SearchBar";
import { useEffect, useState } from "react";
import Pagination from "./Pagination";
import { useAuthStore } from "../../store/useAuthStore";
import { TenureSelector } from "../ui/DropDown";
import TableSkeleton from "../ui/TableSkeleton";

export type Subject = {
  id: string;
  name: string;
  subject_code: string;
  teacher_id: string;
};

export type ApiResponse = {
  subjects: Subject[];
};

const fetchData = async (year: number, sem: number) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const { data } = await axios.get<ApiResponse>(
    `${apiUrl}/teacher/subjects`,
    {
      withCredentials: true,
      params: { year, sem },
    }
  );

  return data;
};

const Table = function () {
  const { tenure } = useAuthStore();
  const year = tenure?.year;
  const sem = tenure?.is_odd;

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const itemsPerPage = 10;

  const {
    data: apiData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["teacherRequests", year, sem],
    queryFn: () => {
      if (year === undefined || sem === undefined) {
        return Promise.resolve({ subjects: [] });
      }
      return fetchData(year, sem);
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        <p>Error loading subjects: {(error as Error).message}</p>
      </div>
    );
  }

  let filteredSubjects: Subject[] = [];
  if (apiData) {
    filteredSubjects = apiData.subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  const totalItems = filteredSubjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubjects = filteredSubjects.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const dropdownActions = [
    {
      title: "Update Due Dates",
      description: "Bulk update due dates for multiple subjects",
      href: "/faculty/bulk-due-date-update",
      icon: <FaCalendarAlt className="w-4 h-4" />,
      color: "text-blue-600",
    },
    {
      title: "Send Requests",
      description: "Send certificate requests to all students",
      href: "/faculty/bulk-send-requests",
      icon: <FaPaperPlane className="w-4 h-4" />,
      color: "text-green-600",
    },
    {
      title: "Reports",
      description: "Generate and view subject reports",
      href: "/faculty/report-section",
      icon: <FaFileAlt className="w-4 h-4" />,
      color: "text-purple-600",
    },
    {
      title: "Verify Rejected",
      description: "Manual verification for rejected requests",
      href: "/faculty/verify-rejected",
      icon: <FaUserCheck className="w-4 h-4" />,
      color: "text-orange-600",
    }
  ];

  return (
    <div className="mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-end items-end mb-6 gap-4 md:gap-3 w-full">
          <div className="flex flex-col sm:flex-row items-end gap-3 w-full md:w-auto">
            {/* Bulk Actions Dropdown */}
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-auto inline-flex items-center justify-between px-3 py-2.5 text-sm sm:text-base font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10"
              >
                <span>Bulk Actions</span>
                <FaChevronDown
                  className={`w-3 h-3 ml-2 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />

                  <div className="absolute right-0 z-20 mt-1 w-full sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    {dropdownActions.map((action, index) => (
                      <Link
                        key={index}
                        to={action.href}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start">
                          <div className={`mt-0.5 ${action.color}`}>{action.icon}</div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {action.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {action.description}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* TenureSelector */}
            <div className="w-full sm:w-auto">
              <TenureSelector />
            </div>
          </div>
        </div>


      </div>


      {/* Rest of the content */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <SearchBar
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="Search by course name or code"
          />
        </div>

        <div className="overflow-x-scroll rounded-lg shadow-sm border border-gray-100 bg-white">
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} className="max-w-7xl mx-auto" />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-sm font-medium text-gray-700">
                  <th className="px-6 py-4 text-left">Course Code</th>
                  <th className="px-6 py-4 text-left">Course Name</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                  <th className="px-6 py-4 text-left">Request Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedSubjects.length > 0 ? (
                  paginatedSubjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">{subject.subject_code}</td>
                      <td className="px-6 py-4">{subject.name}</td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/faculty/students/${subject.subject_code}`}
                          state={{ subjectId: subject.id }}
                          className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md shadow-sm transition-colors duration-200"
                        >
                          View Students
                          <FaArrowRight className="ml-2 text-sm" />
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/faculty/students/requests/${subject.subject_code}`}
                          state={{
                            subjectId: subject.id,
                            subjectName: subject.name,
                          }}
                          className="inline-flex items-center px-4 py-2 bg-slate-600 hover:bg-black text-white text-sm font-medium rounded-md shadow-sm transition-colors duration-200"
                        >
                          Request Status
                          <FaArrowRight className="ml-2 text-sm" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No subjects found. Please select a different tenure or try another search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        )}
      </div>
    </div>
  );
};

export default Table;