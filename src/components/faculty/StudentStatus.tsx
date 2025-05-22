import { FaArrowLeft } from "react-icons/fa";
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Pagination from "./Pagination";

const headings = [
  "Student Name",
  "NSUT Roll No.",
  "Email",
  "Status",
  "Due Date"
];

export type Student = {
  "id": string;
  "name": string;
  "email": string;
  "roll_number": string;
}

export type Subject = {
  "id": string;
  "name": string;
  "subject_code": string;
  "teacher_id": string;
}

export type Request = {
  "student": Student;
  "subject": Subject;
  "status": "pending" | "completed" | "rejected";
  "created_at": string;
  "due_date": string;
}

export type ApiResponse = {
  requests: Request[];
}

const StudentStatus = function () {
  const { subjectCode: urlSubjectCode } = useParams<{ subjectCode: string }>();
  const location = useLocation();
  const subjectCode = urlSubjectCode;
  const subjectId = location.state?.subjectId;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(2);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "rejected">("all");

  const fetchData = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    
    const {data} = await axios.get<ApiResponse>(
      `${apiUrl}/teacher/subject/requests/${subjectId}`,
      {
        withCredentials: true,
      }
    );
    
    return data;
  };

  const { data: apiData, error, isLoading } = useQuery({
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
        duplicateNamesCount: 0
      };
    }

    const requests = apiData.requests;
    
    // Calculate statistics
    const totalRequests = requests.length;
    const completedCount = requests.filter(req => req.status === "completed").length;
    const pendingCount = requests.filter(req => req.status === "pending").length;
    const rejectedCount = requests.filter(req => req.status === "rejected").length;
    
    // Calculate duplicate names
    const nameCount = new Map<string, number>();
    requests.forEach(req => {
      const name = req.student.name.toLowerCase().trim();
      nameCount.set(name, (nameCount.get(name) || 0) + 1);
    });
    const duplicateNamesCount = Array.from(nameCount.values()).filter(count => count > 1).length;

    // Apply status filter
    const filteredRequests = statusFilter === "all" 
      ? requests 
      : requests.filter(req => req.status === statusFilter);

    return {
      filteredRequests,
      totalRequests,
      completedCount,
      pendingCount,
      rejectedCount,
      duplicateNamesCount
    };
  }, [apiData?.requests, statusFilter]);

  // Calculate pagination data
  const paginationData = useMemo(() => {
    const { filteredRequests } = statisticsAndFilteredData;
    
    if (!filteredRequests.length) {
      return {
        currentPageData: [],
        totalPages: 0,
        totalItems: 0
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
      totalItems
    };
  }, [statisticsAndFilteredData.filteredRequests, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter change
  const handleFilterChange = (filter: "all" | "pending" | "completed" | "rejected") => {
    setStatusFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Get appropriate status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  return (
    <>
    <div className="mx-auto px-4 py-8">
      <h1 className="text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
        Student Status
      </h1>
   
    <div className="overflow-hidden rounded-lg shadow-md border border-gray-100 bg-white max-w-7xl mx-auto">
      <div className="flex items-center p-4 border-b bg-gray-50">
        <Link to="/faculty/dashboard" className="hover:bg-gray-200 p-2 rounded-full transition-colors">
          <FaArrowLeft className="text-gray-600" />
        </Link>
        <h2 className="text-xl font-semibold ml-3 text-gray-800">{subjectCode}</h2>
      </div>

      {/* Statistics Section */}
      <div className="p-4 bg-blue-50 border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statisticsAndFilteredData.completedCount}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{statisticsAndFilteredData.pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{statisticsAndFilteredData.rejectedCount}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{statisticsAndFilteredData.duplicateNamesCount}</div>
            <div className="text-sm text-gray-600">Duplicate Names</div>
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
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          Loading
        </div>
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
                    <th key={idx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginationData.currentPageData.length > 0 ? (
                  paginationData.currentPageData.map((request) => (
                    <tr key={request.student.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{request.student.name}</div>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headings.length} className="px-6 py-4 text-center text-gray-500">
                      {statusFilter === "all" ? "No students found" : `No ${statusFilter} students found`}
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