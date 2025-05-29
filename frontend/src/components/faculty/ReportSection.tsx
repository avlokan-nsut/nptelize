import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "../student/SearchBar";
import { useEffect, useState } from "react";
import Pagination from "./Pagination";

const headings = ["Subject Code", "Subject Name", "Actions"];

export type Subject = {
  id: string;
  name: string;
  subject_code: string;
  teacher_id: string;
};

export type ApiResponse = {
  subjects: Subject[];
};

export type Student = {
  id: string;
  name: string;
  email: string;
  roll_number: string;
};

export type Request = {
  id: string;
  student: Student;
  subject: Subject;
  status: "pending" | "completed" | "rejected" | "no_certificate";
  verified_total_marks: string;
  created_at: string;
  due_date: string;
};

export type ApiResponseCSV = {
  requests: Request[];
};

const apiUrl = import.meta.env.VITE_API_URL;

const fetchData = async () => {
  const { data } = await axios.get<ApiResponse>(`${apiUrl}/teacher/subjects`, {
    withCredentials: true,
  });

  // console.log(data);

  return data;
};

const ReportSection = function () {
  const {
    data: apiData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["teacherRequests"],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [CSVdata, setCSVData] = useState<Request[]>([]);
  const [disabled, setDisabled] = useState<boolean>(false);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleClick = async (subjectIds: string[]) => {
    try {
      setDisabled(true);

      const allRequests: Request[] = [];

      for (const subjectId of subjectIds) {
        const { data } = await axios.get<ApiResponseCSV>(
          `${apiUrl}/teacher/subject/requests/${subjectId}`,
          {
            withCredentials: true,
          }
        );

        if (data.requests && data.requests.length > 0) {
          if (statusFilter === "all") {
            allRequests.push(...data.requests);
          } else {
            const filteredRequests = data.requests.filter(
              (request) => request.status === statusFilter
            );
            allRequests.push(...filteredRequests);
          }
        }
      }

      if (allRequests.length > 0) {
        setCSVData(allRequests);
        downloadCSV(allRequests);
      } else {
        alert("No data available for download");
        setDisabled(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error fetching data for download");
      setDisabled(false);
    }
  };

  const downloadCSV = (csvData?: Request[]) => {
    const dataToDownload = csvData || CSVdata;

    const headers = [
      "Student Name",
      "NSUT Roll No.",
      "Marks",
      "Subject Name",
      "Subject Code",
      "Status",
    ];

    const escapeCSV = (value: string) => {
      if (value == null || value === undefined) return "";
      const stringValue = String(value);
      if (
        stringValue.includes('"') ||
        stringValue.includes(",") ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = [
      headers.join(","),
      ...dataToDownload.map((request) =>
        [
          escapeCSV(request.student.name),
          escapeCSV(request.student.roll_number),
          escapeCSV(request.verified_total_marks),
          escapeCSV(request.subject.name),
          escapeCSV(request.subject.subject_code),
          escapeCSV(request.status),
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `students_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error generating CSV:", err);
      alert("Error generating CSV file");
    } finally {
      setCSVData([]);
      setDisabled(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        <p>Error loading subjects: {(error as Error).message}</p>
      </div>
    );
  }

  if (!apiData || apiData.subjects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-500">No subjects found</p>
      </div>
    );
  }

  const filteredSubjects = apiData.subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredSubjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubjects = filteredSubjects.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-center text-xl md:text-2xl font-semibold text-gray-800 tracking-wider">
        Report Section
      </h1>

      <div className="w-full flex flex-col justify-end space-x-2 mt-10 md:flex-row md:mt-0">
        <div className="flex flex-col">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium text-gray-700 mb-1 "
          >
            Filter by Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="no_certificate">No Certificate</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <button
          className={`p-3 text-sm rounded-2xl my-4 transition-colors duration-200 md:p-4 md:text-md ${
            disabled
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-black text-white cursor-pointer hover:bg-gray-500"
          }`}
          disabled={disabled}
          onClick={() =>
            handleClick(apiData.subjects.map((subject) => subject.id))
          }
        >
          Download all
        </button>
      </div>

      {disabled && (
        <h1 className="text-center px-2 py-1 font-semibold rounded-full bg-yellow-100 text-yellow-800 my-4">
          This is a resource intense task and can take upto 5 minutes
        </h1>
      )}

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
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-sm font-medium text-gray-700">
              {headings.map((heading, idx) => (
                <th key={idx} className="px-6 py-4 text-center ">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedSubjects.map((subject) => (
              <tr
                key={subject.id}
                className="hover:bg-gray-50 transition-colors duration-200 text-center"
              >
                <td className="px-6 py-4 ">{subject.subject_code}</td>
                <td className="px-6 py-4">{subject.name}</td>
                <td className="px-6 py-4 text-center whitespace-nowrap text-gray-700">
                  <div>
                    <button
                      className={`py-2 px-4 rounded-md shadow-md transition-all duration-300 transform ${
                        disabled
                          ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                          : "text-black hover:scale-105 hover:bg-black hover:text-white cursor-pointer"
                      }`}
                      onClick={() => handleClick([subject.id])}
                      disabled={disabled}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  );
};

export default ReportSection;
