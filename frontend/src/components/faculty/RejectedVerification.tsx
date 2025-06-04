import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "./SearchBar";
import { useEffect, useState } from "react";
import Pagination from "./Pagination";
import { CheckCircle, Loader2 } from "lucide-react";

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

export type CertificateDetails = {
  uploaded_certificate: {
    student_name: string;
    roll_no: string;
    marks: string;
    course_name: string;
    course_period: string;
    file_url: string;
  };
  verification_certificate: {
    student_name: string;
    roll_no: string;
    marks: string;
    course_name: string;
    course_period: string;
    file_url: string;
  };
  subject_name: string;
  remark: string;
};

export type CertificateApiResponse = {
  message: string;
  data: CertificateDetails;
};

export type RejectedRequestWithDetails = {
  id: string;
  student: Student;
  subject: Subject;
  status: "rejected";
  created_at: string;
  due_date: string;
  certificate_details: CertificateDetails;
};

const headings = [
            "Roll Number",
            "NSUT Name",
            "Uploaded Student Name",
            "NPTEL Certificate Student Name",
            "Requested Course",
            "Uploaded Certificate Course Name",
            "NPTEL Certificate Course Name",
            "Verified Marks",
            "Certificate Marks",
            "Year",
            "Certificate Year",
            "Status",
            "Differences",
            "Actions"
        ];

const apiUrl = import.meta.env.VITE_API_URL;

const fetchRejectedRequests = async (): Promise<RejectedRequestWithDetails[]> => {
  // Fetch subjects data
  const { data: subjectsData } = await axios.get<ApiResponse>(`${apiUrl}/teacher/subjects`, {
    withCredentials: true,
  });

  // Fetch all requests for each subject and filter rejected ones
  const requestPromises = subjectsData.subjects.map(async (subject) => {
    const { data: requestData } = await axios.get<ApiResponseCSV>(
      `${apiUrl}/teacher/subject/requests/${subject.id}`,
      { withCredentials: true }
    );
    return requestData.requests.filter(request => request.status === 'rejected');
  });

  // Wait for all requests to complete and flatten the array
  const allRequestsArrays = await Promise.all(requestPromises);
  const rejectedRequests = allRequestsArrays.flat();

  // Fetch certificate details for each rejected request
  const requestsWithDetails: (RejectedRequestWithDetails | null)[] = await Promise.all(
    rejectedRequests.map(async (request): Promise<RejectedRequestWithDetails | null> => {
      try {
        const { data: certificateData } = await axios.get<CertificateApiResponse>(
          `${apiUrl}/teacher/certificate/details/${request.id}`,
          { withCredentials: true }
        );
        
        return {
          ...request,
          status: "rejected" as const,
          certificate_details: certificateData.data,
        };
      } catch (error) {
        console.error(`Failed to fetch certificate details for request ${request.id}:`, error);
        return null;
      }
    })
  );

  // Filter out null values and return properly typed array
  return requestsWithDetails.filter((request): request is RejectedRequestWithDetails => request !== null);
};

const RejectedVerification = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingRequests, setLoadingRequests] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);


  const {
    data: rejectedRequests,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["rejectedRequests"],
    queryFn: fetchRejectedRequests,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        <p>Error loading rejected requests: {(error as Error).message}</p>
      </div>
    );
  }

  if (!rejectedRequests || rejectedRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-500">No rejected requests found</p>
      </div>
    );
  }

  const filteredRequests = rejectedRequests.filter(
    (request) =>
      request.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.subject.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.certificate_details.uploaded_certificate.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.certificate_details.verification_certificate.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const acceptCertificate = async (
    fileId: string, 
    request_id: string,
    subject_id: string,
    student_id: string,
  ): Promise<void> => {
    // Set loading state for this specific request
    setLoadingRequests(prev => new Set(prev).add(request_id));
    
    try {
      // 1. Construct the file URL
      const fileUrl = `${apiUrl}/user/certificate/file/${fileId}?download=false`;

      // 2. Fetch the file as a blob
      const fileResponse = await fetch(fileUrl, { credentials: 'include' });
      if (!fileResponse.ok) throw new Error('Failed to fetch file');

      const blob = await fileResponse.blob();

      // 3. Convert blob to File
      const file = new File([blob], `${fileId}.pdf`, { type: blob.type });

      // FormData
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${apiUrl}/teacher/verify/certificate/manual?request_id=${request_id}&subject_id=${subject_id}&student_id=${student_id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Certificate accepted:', response.data);
      
      // Refresh the data after successful acceptance
      await refetch();
      
    } catch (error) {
      console.error('Error during certificate acceptance:', error);
      // You might want to show a toast notification here
      alert('Failed to accept certificate. Please try again.');
    } finally {
      // Remove loading state for this request
      setLoadingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request_id);
        return newSet;
      });
    }
  };

  const acceptAllCertificates = async (requests: RejectedRequestWithDetails[]): Promise<void> => {
    setIsAcceptingAll(true);
    
    try {
      // Process requests in batches to avoid overwhelming the server
      const batchSize = 3;
      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (request) => {
            try {
              await acceptCertificate(
                request.certificate_details.uploaded_certificate.file_url,
                request.id,
                request.subject.id,
                request.student.id
              );
            } catch (error) {
              console.error(`Failed to accept certificate for request ${request.id}:`, error);
            }
          })
        );
       
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      
      await refetch();
      
    } catch (error) {
      console.error('Error during bulk certificate acceptance:', error);
      alert('Some certificates failed to be accepted. Please check individual results.');
    } finally {
      setIsAcceptingAll(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-center text-xl md:text-2xl font-semibold text-gray-800 tracking-wider">
        Rejected Verification Requests
      </h1>

      <div className="mb-4 mt-8">
        <SearchBar
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          placeholder="Search by student name, roll number, subject name or code"
        />
      </div>

      <div className="p-4 bg-red-50 border-b mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {rejectedRequests.length}
          </div>
          <div className="text-sm text-gray-600">Total Rejected Requests</div>
        </div>
        {filteredRequests.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => acceptAllCertificates(filteredRequests)}
                disabled={isAcceptingAll || loadingRequests.size > 0}
                className={`inline-flex items-center px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isAcceptingAll || loadingRequests.size > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                }`}
              >
                {isAcceptingAll ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Accepting All ({filteredRequests.length})...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>
                      Accept All ({"This can't be undone"}) ({filteredRequests.length})
                    </span>

                  </>
                )}
              </button>
            </div>
          )}
      </div>



      <div className="overflow-x-scroll rounded-lg shadow-sm border border-gray-100 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-sm font-medium text-gray-700">
              {headings.map((heading, idx) => (
                <th key={idx} className="px-4 py-3 text-center whitespace-nowrap">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRequests.map((request) => {
              const uploadedCert = request.certificate_details.uploaded_certificate;
              const verificationCert = request.certificate_details.verification_certificate;

              return (
                <tr
                  key={request.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  {/* Roll Number */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{request.student.roll_number}</div>
                  </td>
                  
                  {/* NSUT Name */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{request.student.name}</div>
                  </td>
                  
                  {/* Student Name */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{uploadedCert.student_name}</div>
                  </td>
                  
                  {/* Certificate Name */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{verificationCert.student_name}</div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{request.subject.name}</div>
                  </td>
                  
                  {/* NPTEL Course Code */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{uploadedCert.course_name}</div>
                  </td>
                  
                  {/* Certificate Course Code */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{verificationCert.course_name}</div>
                  </td>
                  
                  {/* Verified Marks */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{verificationCert.marks}</div>
                  </td>
                  
                  {/* Certificate Marks */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{uploadedCert.marks}</div>
                  </td>
                  
                  {/* Year */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{verificationCert.course_period}</div>
                  </td>
                  
                  {/* Certificate Year */}
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{uploadedCert.course_period}</div>
                  </td>
                  
                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Rejected
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="text-sm">{request.certificate_details.remark}</div>
                  </td>
                  
                  {/* Differences
                  <td className="px-4 py-3 text-center">
                    <div className="text-xs">
                      {differences.length > 0 ? (
                        <div className="space-y-1">
                          {differences.map((diff, idx) => (
                            <div key={idx} className="bg-red-100 text-red-700 px-2 py-1 rounded">
                              {diff}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">{request.certificate_details.remark}</span>
                      )}
                    </div>
                  </td> */}

                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => acceptCertificate(
                        request.certificate_details.uploaded_certificate.file_url,
                        request.id,
                        request.subject.id,
                        request.student.id
                      )}
                      disabled={loadingRequests.has(request.id)}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        loadingRequests.has(request.id)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                      }`}
                    >
                      {loadingRequests.has(request.id) ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                
              );
            })}
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

export default RejectedVerification;