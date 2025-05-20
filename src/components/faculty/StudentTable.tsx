import { FaArrowLeft } from "react-icons/fa";
import { Link, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const headings = [
  "Select",
  "Student Name",
  "NSUT Roll No.",
  "Email",
  "Due Date",
];

export type Student = {
  "id": string;
  "name": string;
  "email": string;
  "roll_number": string;
}

export type ApiResponse = {
  enrolled_students: Student[];
}

const StudentTable = function () {
  const { subjectCode: urlSubjectCode } = useParams<{ subjectCode: string }>();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const location = useLocation();
  const subjectCode = urlSubjectCode;
  const subjectId = location.state?.subjectId;
  
  // Add state for selected students only (removed due date)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Calculate default due date (7 days from today)
  const getDefaultDueDate = () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7);
    return futureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };
  
  const defaultDueDate = getDefaultDueDate();

  // Function to handle student selection
  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Function to handle form submission (updated to use default due date)
  const handleSubmit = async() => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
      return;
    }

    const formattedData = {
      student_request_data_list: selectedStudents.map(studentId => ({
        student_id: studentId,
        subject_id: subjectId,
        due_date: new Date(defaultDueDate).toISOString()
      }))
    };

    console.log("Submission data:", formattedData);
   
    const apiUrl = import.meta.env.VITE_API_URL;
    setIsLoadingPost(true);
    const response = await axios.post(`${apiUrl}/teacher/students/request`, formattedData, {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .catch((error) => {
      console.error("Error submitting request:", error);
      setError(true);
    });

    console.log(response)
    if (response && response.status === 200) {
      setSuccess(true);
      setSelectedStudents([]);
    } else {
      setError(true);
    }
    setIsLoadingPost(false);
  };

  const fetchData = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    
    const {data} = await axios.get<ApiResponse>(
      `${apiUrl}/teacher/students/${subjectId}`,
      {
        withCredentials: true,
      }
    );
    // console.log(data);
    
    return data;
  };

  const { data: apiData, error:apiError, isLoading } = useQuery({
    queryKey: ["teacherRequestsStudents", subjectId],
    queryFn: fetchData,
    refetchOnWindowFocus: false,
  });

  return (
    <>
    <div className="mx-auto px-4 py-8">
      <h1 className="text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
        Student List
      </h1>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline"> Request submitted successfully.</span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Error submitting request. Please try again.</span>
        </div>
      )}
    
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
      ) : apiError ? (
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
                {apiData?.enrolled_students && apiData.enrolled_students.length > 0 ? (
                  apiData.enrolled_students.map((student) => (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                        selectedStudents.includes(student.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleStudentSelection(student.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => {}} 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {student.roll_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {defaultDueDate}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headings.length} className="px-6 py-10 text-center text-gray-500">
                      No students found for this subject.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {/* <span className="text-sm text-gray-600">
                  Default due date: <span className="font-medium">{defaultDueDate}</span>
                </span> */}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={selectedStudents.length === 0}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoadingPost ? "Submitting Request" : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </div>
    </>
  );
};

export default StudentTable;
