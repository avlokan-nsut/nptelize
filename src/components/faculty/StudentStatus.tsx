import { FaArrowLeft } from "react-icons/fa";
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";


const headings = [
  "Student Name",
  "NSUT Roll No.",
  "Email",
  "Status",
  "Request Date"
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
}

export type ApiResponse = {
  requests: Request[];
}

const StudentStatus = function () {
  const { subjectCode: urlSubjectCode } = useParams<{ subjectCode: string }>();
  const location = useLocation();
  const subjectCode = urlSubjectCode;
  const subjectId = location.state?.subjectId;

  const fetchData = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    const {data} = await axios.get<ApiResponse>(
      `${apiUrl}/teacher/requests/${subjectId}`,
      {
        withCredentials: true,
      }
    );
    console.log(data);
   
    
    return data;
  };

  const { data: apiData, error, isLoading } = useQuery({
    queryKey: ["teacherRequestsStudents", subjectId],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
  });

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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          Loading
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500">
          Error loading student data. Please try again.
        </div>
      ) : (
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
              {apiData?.requests && apiData.requests.length > 0 ? (
                apiData.requests.map((request) => (
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
                      {formatDate(request.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headings.length} className="px-6 py-4 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
    </>
  );
};

export default StudentStatus;
