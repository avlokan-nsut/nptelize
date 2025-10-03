import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "./SearchBar";
import { useEffect, useState } from "react";
import Pagination from "./Pagination";
import { useAuthStore } from "../../store/useAuthStore";
import { TenureSelector } from "../ui/DropDown";
import TableSkeleton from "../ui/TableSkeleton";

const headings = ["Subject Code", "Subject Name", "Actions", "Request Status"];

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

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  return (
    <>
      <div className="flex justify-center md:justify-end  max-w-7xl mx-auto">
        <TenureSelector />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="w-full flex justify-center md:justify-end space-x-2 mt-4 md:flex-row md:mt-0">
         <Link to="/faculty/bulk-due-date-update">
            <button className="p-3 text-sm rounded-2xl my-4 transition-colors duration-200 md:p-4 md:text-md bg-blue-900 text-white hover:bg-blue-800 cursor-pointer">
              Bulk Due Date Update  
            </button>
          </Link>
          <Link to="/faculty/verify-rejected">
            <button className="p-3 text-sm rounded-2xl my-4 transition-colors duration-200 md:p-4 md:text-md bg-blue-900 text-white hover:bg-blue-800 cursor-pointer">
              Manual Verification
            </button>
          </Link>

          <Link to="/faculty/report-section">
            <button className="p-3 text-sm rounded-2xl my-4 transition-colors duration-200 md:p-4 md:text-md bg-black text-white cursor-pointer hover:bg-gray-500">
              Report Section
            </button>
          </Link>
        </div>

        <div className="mb-4">
          <SearchBar
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="Search by subject name or code"
          />
        </div>

        <div className="overflow-x-scroll rounded-lg shadow-sm border border-gray-100 bg-white">
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} className="max-w-7xl mx-auto" />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-sm font-medium text-gray-700">
                  {headings.map((heading, idx) => (
                    <th key={idx} className="px-6 py-4 text-left">
                      {heading}
                    </th>
                  ))}
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
                      No subjects found. Please select a different tenure or try
                      another search.
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
    </>
  );
};

export default Table;
