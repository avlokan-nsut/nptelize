import { FaArrowLeft, FaDownload, FaChevronRight} from "react-icons/fa";
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useQuery} from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Pagination from "./Pagination";
import SearchBar from "./SearchBar";
import RequestDetailsDropdown from "./RequestDetailsDropdown";

const headings = [
  "Student Name",
  "NSUT Roll No.",
  "Email",
  "Status",
  "Due Date",
  "Total Marks",
  "Actions",
  "",
];

export type Student = {
  id: string;
  name: string;
  email: string;
  roll_number: string;
};

export type Subject = {
  id: string;
  name: string;
  subject_code: string;
  nptel_course_code: string;
  teacher_id: string;
};

export type Request = {
  id: string;
  student: Student;
  subject: Subject;
  status: "pending" | "completed" | "rejected" | "no_certificate" | "under_review";
  verified_total_marks: string;
  created_at: string;
  due_date: string;
};

export type ApiResponse = {
  requests: Request[];
};

const apiUrl = import.meta.env.VITE_API_URL;

const StudentStatus = function () {
  
  const { subjectCode: urlSubjectCode } = useParams<{ subjectCode: string }>();
  const location = useLocation();
  const subjectCode = urlSubjectCode;
  const subjectId = location.state?.subjectId; 
  const subjectName = location.state?.subjectName;
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed" | "rejected" | "duplicate" | "no_certificate" |"under_review"
  >("all");

  const fetchData = async () => {
    

    const { data } = await axios.get<ApiResponse>(
      `${apiUrl}/teacher/subject/requests/${subjectId}`,
      {
        withCredentials: true,
      }
    );
    // console.log(data);

    return data;
  };

  const {
    data: apiData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["teacherRequestsStudents", subjectId],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
  });

  // Calculate statistics and filtered data
  const statisticsAndFilteredData = useMemo(() => {
    if (!apiData?.requests) {
      return {
        filteredRequests: [],
        totalRequests: 0,
        completedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        duplicateNamesCount: 0,
        noCertificateCount: 0,
        under_review : 0,
      };
    }

    const requests = apiData.requests;

    // Calculate statistics
    const totalRequests = requests.length;
    const completedCount = requests.filter(
      (req) => req.status === "completed"
    ).length;
    const pendingCount = requests.filter(
      (req) => req.status === "pending"
    ).length;
    const rejectedCount = requests.filter(
      (req) => req.status === "rejected"
    ).length;
    const noCertificateCount = requests.filter(
      (req) => req.status === "no_certificate"
    ).length;
    const under_review = requests.filter(
      (req) => req.status === "under_review"
    ).length

    // Calculate duplicate names
    const nameCount = new Map<string, number>();
    requests.forEach((req) => {
      const name = req.student.name.toLowerCase().trim();
      nameCount.set(name, (nameCount.get(name) || 0) + 1);
    });
    const duplicateNamesCount = Array.from(nameCount.values()).filter(
      (count) => count > 1
    ).length;

    let filteredRequests = [];

    if (statusFilter === "duplicate") {
      filteredRequests = requests.filter((req) => {
        const name = req.student.name.toLowerCase().trim();
        return nameCount.get(name)! > 1;
      });

       filteredRequests.sort((a, b) => 
    a.student.name.toLowerCase().trim().localeCompare(b.student.name.toLowerCase().trim())
      );

    } else if (statusFilter === "all") {
      filteredRequests = requests;
    } else {
      filteredRequests = requests.filter((req) => req.status === statusFilter);
    }

    if (searchTerm) {
      filteredRequests = filteredRequests.filter((req) =>
        req.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return {
      filteredRequests,
      totalRequests,
      completedCount,
      pendingCount,
      rejectedCount,
      duplicateNamesCount,
      noCertificateCount,
      under_review
    };
  }, [apiData?.requests, statusFilter, searchTerm]);

  // Calculate pagination data
  const paginationData = useMemo(() => {
    const { filteredRequests } = statisticsAndFilteredData;

    if (!filteredRequests.length) {
      return {
        currentPageData: [],
        totalPages: 0,
        totalItems: 0,
      };
    }

    const totalItems = filteredRequests.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredRequests.slice(startIndex, endIndex);

    return {
      currentPageData,
      totalPages,
      totalItems,
    };
  }, [statisticsAndFilteredData.filteredRequests, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter change
  const handleFilterChange = (
    filter: "all" | "pending" | "completed" | "rejected" | "duplicate" | "no_certificate" | "under_review"
  ) => {
    setStatusFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    if (dateString == null || dateString == undefined) {
      return "";
    }

    const date = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);

    return istDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  //CSV funtionality
  const downloadCSV = () => {
    if (!statisticsAndFilteredData.filteredRequests.length) {
      alert("No data to download");
      return;
    }

    const headers = [
      "Student Name",
      "NSUT Roll No.",
      "Marks",
      "Subject Name",
      "Subject Code",
      'Status'
    ];

    const escapeCSV = (value: string) => {
      if (value == null || value === undefined) return "";
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (
        stringValue.includes('"') ||
        stringValue.includes(",") ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Convert data to CSV format
    const csvRows = [
      headers.join(","), // Header row
      ...statisticsAndFilteredData.filteredRequests.map((request) =>
        [
          escapeCSV(request.student.name),
          escapeCSV(request.student.roll_number),
          escapeCSV(request.verified_total_marks),
          escapeCSV(subjectName),
          escapeCSV(request.subject.subject_code),
          escapeCSV(request.status)
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");

    try {
      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `${subjectCode}_students_${statusFilter}_${
            new Date().toISOString().split("T")[0]
          }.csv`
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
    }
  };

  // Get appropriate status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
        
      case "no_certificate":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-fuchsia-800">
  No Certificate
</span>
        );

       case "under_review":
         return (  
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Under Review
          </span>
        );

      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
  };


  

  return (
    <>
      <div className="mx-auto px-4 py-8">
        <h1 className="text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
          Student Status
        </h1>

        <div className="overflow-hidden rounded-lg shadow-md border border-gray-100 bg-white max-w-7xl mx-auto">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center">
              <Link
                to="/faculty/dashboard"
                className="hover:bg-gray-200 p-2 rounded-full transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </Link>
              <h2 className="text-xl font-semibold ml-3 text-gray-800">
                {subjectCode}
              </h2>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadCSV}
              disabled={!statisticsAndFilteredData.filteredRequests.length}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <FaDownload className="text-sm" />
              Download CSV
            </button>
          </div>

          {/* Statistics Section */}
          <div className="p-4 bg-blue-50 border-b">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {statisticsAndFilteredData.completedCount}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {statisticsAndFilteredData.pendingCount}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {statisticsAndFilteredData.rejectedCount}
                </div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-fuchsia-600">
                  {statisticsAndFilteredData.noCertificateCount}
                </div>
                <div className="text-sm text-gray-600">No Certificate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {statisticsAndFilteredData.duplicateNamesCount}
                </div>
                <div className="text-sm text-gray-600">Duplicate Names</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {statisticsAndFilteredData.under_review}
                </div>
                <div className="text-sm text-gray-600">Under Review</div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                All ({statisticsAndFilteredData.totalRequests})
              </button>
              <button
                onClick={() => handleFilterChange("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "pending"
                    ? "bg-yellow-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Pending ({statisticsAndFilteredData.pendingCount})
              </button>
              <button
                onClick={() => handleFilterChange("completed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "completed"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Completed ({statisticsAndFilteredData.completedCount})
              </button>
              <button
                onClick={() => handleFilterChange("rejected")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "rejected"
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Rejected ({statisticsAndFilteredData.rejectedCount})
              </button>
              <button
                onClick={() => handleFilterChange("no_certificate")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "no_certificate"
                    ? "bg-fuchsia-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                No Certificate ({statisticsAndFilteredData.noCertificateCount})
              </button>
              <button
                onClick={() => handleFilterChange("duplicate")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "duplicate"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Duplicate ({statisticsAndFilteredData.duplicateNamesCount})
              </button>
              <button
                onClick={() => handleFilterChange("under_review")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === "under_review"
                    ? "bg-yellow-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Under Review ({statisticsAndFilteredData.under_review})
              </button>
            </div>
          </div>

          <div className="p-4 border-b bg-gray-50">
            <SearchBar
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              placeholder="Search by name, roll number, or email"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">Loading</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              Error loading student data. Please try again.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {headings.map((heading, idx) => (
                        <th
                          key={idx}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginationData.currentPageData.length > 0 ? (
                      paginationData.currentPageData.map((request) => (
                        <>
                          {(request.status === "under_review") ? (
                            // Accordion rows for pending/under_review requests
                            <>
                              <tr 
                                key={request.student.id}
                                className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                                onClick={() => setOpenDropdownId(openDropdownId === request.id ? null : request.id)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="font-medium text-gray-900">
                                    {request.student.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                  {request.student.roll_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                  {request.student.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getStatusBadge(request.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                  {formatDate(request.due_date)}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap text-gray-700">
                                  {request.verified_total_marks}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                  <FaChevronRight 
                                    className={`w-4 h-4 transition-transform mx-auto ${openDropdownId === request.id ? 'rotate-90' : ''}`} 
                                  />
                                </td>
                              </tr>
                              {openDropdownId === request.id && (
                                <RequestDetailsDropdown 
                                  request={request}
                                  colSpan={headings.length}
                                  subjectId={subjectId}
                                  onClose={() => setOpenDropdownId(null)}
                                />
                              )}
                            </>
                          ) : (
                            // Regular row for other statuses
                            <tr
                              key={request.student.id}
                              className="hover:bg-gray-50 transition-colors duration-150"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">
                                  {request.student.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                {request.student.roll_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                {request.student.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(request.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                {formatDate(request.due_date)}
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap text-gray-700">
                                {request.verified_total_marks}
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap text-gray-700">
                                
                                  <div>
                                    <div className=" text-black py-2 rounded-md shadow-md transition-all duration-300 transform hover:scale-105 hover:bg-black hover:text-white">
                                      <a
                                        href={`${apiUrl}/user/certificate/file/${request.id}.pdf?download=false`}
                                        target="_blank"
                                        className="flex items-center justify-center font-medium"
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
                                      </a>
                                    </div>
                                  </div>
                                
                                
                              </td>
      
                            </tr>
                          )}
                        </>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={headings.length}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          {statusFilter === "all"
                            ? "No students found"
                            : `No ${statusFilter} students found`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Component */}
              <Pagination
                currentPage={currentPage}
                totalPages={paginationData.totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={paginationData.totalItems}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentStatus;
                                         