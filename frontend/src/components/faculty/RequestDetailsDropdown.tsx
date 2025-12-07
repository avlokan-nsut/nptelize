import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaTimes, FaCheck, FaInfoCircle } from "react-icons/fa";
import { Request } from "./StudentStatus";
import { CertificateApiResponse } from "../../types/faculty/MannualVerification";
import MannualAlert from "./MannualAlert";
import { toast } from "react-toastify";
import { useAuthStore } from "../../store/useAuthStore";

const apiUrl = import.meta.env.VITE_API_URL;

interface RequestDetailsDropdownProps {
  request: Request;
  colSpan: number;
  subjectId: string;
  onClose: () => void;
  showReject:boolean;
}

const RequestDetailsDropdown = ({ request, colSpan, onClose,showReject }: RequestDetailsDropdownProps) => {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisable] = useState<string | null>(null);
  const [isAcceptLoading, setIsAcceptLoading] = useState(false);
  const [isRejectLoading, setIsRejectLoading] = useState(false);
  
  // Get year and sem from auth store
  const { tenure } = useAuthStore();
  const year = tenure?.year;
  const sem = tenure?.is_odd;

  const fetchCertInfo = async (requestId: string) => {
    try {
      const res = await axios.get<CertificateApiResponse>(`${apiUrl}/teacher/certificate/details/${requestId}`, { withCredentials: true });
      return res.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  };

  const certQueries = useMemo(
    () => ({
      queryKey: ["certInfo", request.id],
      queryFn: () => fetchCertInfo(request.id),
      enabled: !!request.id,
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1 * 60 * 1000,
    }),
    [request.id]
  );
  const { data: certData, isFetching: certLoading } = useQuery(certQueries);

  const handleAccept = async () => {
    setIsAcceptLoading(true);
    try {
      const marks = certData?.data?.uploaded_certificate?.marks ||
        certData?.data?.verification_certificate?.marks ||
        parseInt(request.verified_total_marks) || 0;

      await axios.post(`${apiUrl}/teacher/verify/certificate/manual/unsafe`, {
        request_id: request.id,
        student_id: request.student.id,
        subject_id: request.subject.id,
        marks: marks
      }, { withCredentials: true });
      
      // Optimistically update the cache for MannualVerification
      queryClient.setQueryData(
        ["teacherRequestsByStatus", year, sem], 
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            requests: oldData.requests.filter((req: any) => req.id !== request.id)
          };
        }
      );
      
      // Also invalidate StudentStatus query to refresh it
      queryClient.invalidateQueries({ queryKey: ["teacherRequestsStudentsStatus"] });
      
      onClose();
      toast.success("Manual Verification Done!");
    } catch (error) {
      console.error('Accept failed:', error);
      
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Unauthorized");
      } else {
        toast.error("Failed to verify certificate");
      }
    } finally {
      setIsAcceptLoading(false);
    }
  };

  const handleReject = async () => {
    setIsRejectLoading(true);
    try {
      await axios.put(`${apiUrl}/teacher/reject/certificate?request_id=${request.id}`, {}, { withCredentials: true });
      
      // Optimistically update the cache for MannualVerification
      queryClient.setQueryData(
        ["teacherRequestsByStatus", year, sem], 
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            requests: oldData.requests.filter((req: any) => req.id !== request.id)
          };
        }
      );
      
      // Also invalidate StudentStatus query to refresh it
      queryClient.invalidateQueries({ queryKey: ["teacherRequestsStudentsStatus"] });
      
      onClose();
      toast.success("Rejected Successfully");
    } catch (error) {
      console.error('Reject failed:', error);
      
     
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error("Unauthorized");
      } else {
        toast.error("Failed to reject certificate");
      }
    } finally {
      setIsRejectLoading(false);
    }
  };


  // Create a mapping for certificate field labels
  const certificateFields = [
    { key: "student_name", label: "Name" },
    { key: "marks", label: "Marks" },
    { key: "course_name", label: "Course" },
    { key: "course_period", label: "Period" },
  ];

  // Function to render certificate details section
  const renderCertificateDetails = (certificate: any, title: string, isEmpty: boolean = false, isNptel: boolean) => {




    return (
      <div className="card bg-base-100 shadow-sm border border-gray-200 h-full">
        <div className="card-body p-4">
          <h4 className={`card-title text-base font-medium mb-3 ${isNptel ? "text-blue-600" : "text-purple-800"}`}>{title}</h4>
          {isEmpty ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <FaInfoCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No certificate available</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {certificateFields.map((field, index) => (
                <div key={index} className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{field.label}</span>
                  <span className="text-sm text-gray-900 mt-1">{certificate[field.key] || 'N/A'}</span>
                </div>
              ))}
              {certificate.file_url && isNptel && (
                <div className="pt-2 border-t border-gray-100">
                  <a
                    href={certificate.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm w-full"
                  >
                    {isNptel ? "View NPTEL certificate" : "View uploaded certificate"}
                  </a>
                </div>
              )}

              {certificate.file_url && !isNptel && (
                <div className="pt-2 border-t border-gray-100">
                  <a
                    href={`${apiUrl}/user/certificate/file/${request.id}.pdf?download=false`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm w-full"
                  >
                    {isNptel ? "View NPTEL certificate" : "View uploaded certificate"}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (

    <tr>
      <td colSpan={colSpan} className="px-0 py-0">
        <div className="bg-base-100 border-t border-gray-200">
          <div className="p-6">
            {/* Three Card Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Student & Subject Information */}
              <div className="card bg-base-100 shadow-sm border border-gray-200">
                <div className="card-body p-4">
                  <h3 className="card-title text-base font-medium text-green-600 mb-3">University Information</h3>
                  <div className="space-y-4">
                    {/* Student Info Section */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Student Details</h5>
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Name</span>
                          <span className="text-sm text-gray-900">{request.student.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subject Info Section */}
                    <div className="pt-3 border-t border-gray-100">
                      <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Course Details</h5>
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Course</span>
                          <span className="text-sm text-gray-900">{request.subject.name}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">NPTEL Course Code</span>
                          <span className="text-sm text-gray-900">{request.subject.nptel_course_code}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Uploaded Certificate */}
              {certLoading ? (
                <div className="card bg-base-100 shadow-sm border border-gray-200">
                  <div className="card-body p-4 flex items-center justify-center">
                    <div className="text-center">
                      <span className="loading loading-spinner loading-md"></span>
                      <p className="text-sm text-gray-500 mt-2">Loading uploaded certificate details...</p>
                    </div>
                  </div>
                </div>
              ) : (
                renderCertificateDetails(
                  certData?.data?.uploaded_certificate,
                  "Uploaded Certificate",
                  !certData?.data?.uploaded_certificate,
                  false

                )
              )}

              {/* Card 3: Verification Certificate */}
              {certLoading ? (
                <div className="card bg-base-100 shadow-sm border border-gray-200">
                  <div className="card-body p-4 flex items-center justify-center">
                    <div className="text-center">
                      <span className="loading loading-spinner loading-md"></span>
                      <p className="text-sm text-gray-500 mt-2">Loading NPTEL certificate details...</p>
                    </div>
                  </div>
                </div>
              ) : (
                renderCertificateDetails(
                  certData?.data?.verification_certificate,
                  "NPTEL Information",
                  !certData?.data?.verification_certificate,
                  true
                )
              )}
            </div>

            {/* Remark Section (if available) */}
            {certData?.data && (
              <div className="card bg-base-100 shadow-sm border border-gray-200 mt-6">
                <div className="card-body p-4">
                  <h4 className="card-title text-base font-medium text-purple-600 mb-2">Mismatched Information</h4>
                  
                  <p className="text-[16px] text-gray-600">{certData.data.uploaded_certificate.student_name !== certData.data.verification_certificate.student_name || certData.data.verification_certificate.student_name !== request.student.name ? "Student Name" : ""}</p>

                  <p className="text-[16px]  text-gray-600">{certData.data.uploaded_certificate.marks !== certData.data.verification_certificate.marks ? "Marks" : ""}</p>

                  <p className="text-[16px]  text-gray-600">{certData.data.uploaded_certificate.course_name !== certData.data.verification_certificate.course_name || request.subject.name !== certData.data.verification_certificate.course_name ? "Course Name" : ""}</p>

                </div>
              </div>
            )}

            {certData?.data?.remark && (
              <div className="card bg-base-100 shadow-sm border border-gray-200 mt-6">
                <div className="card-body p-4">
                  <h4 className="card-title text-base font-medium text-purple-600 mb-2">Remarks</h4>
                  <p className="text-sm text-gray-600">{certData.data.remark}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
              {showReject && (<button 
                onClick={handleReject} 
                disabled={isRejectLoading || isAcceptLoading}
                className="btn btn-error btn-sm gap-2 text-white"
              >
                {isRejectLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <FaTimes className="w-4 h-4 text-white" />
                )}
                {isRejectLoading ? 'Rejecting...' : 'Reject'}
              </button>)}

              {certData?.data?.uploaded_certificate && 
                certData?.data?.verification_certificate &&
                certData?.data?.uploaded_certificate?.marks !== "N/A" &&
                certData?.data?.verification_certificate?.marks !== "N/A" &&
                <button 
                  onClick={handleAccept} 
                  disabled={isAcceptLoading || isRejectLoading}
                  className="btn btn-success btn-sm gap-2 text-white"
                >
                  {isAcceptLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FaCheck className="w-4 h-4 text-white" />
                  )}
                  {isAcceptLoading ? 'Accepting...' : 'Accept'}
                </button>
              }

              {((!certData?.data?.uploaded_certificate || !certData?.data?.verification_certificate) ||
                certData?.data?.uploaded_certificate?.marks === "N/A" ||
                certData?.data?.verification_certificate?.marks === "N/A") &&
                <div>
                  <button 
                    onClick={() => { setIsVisable(request.id) }} 
                    className="btn btn-success btn-sm gap-2 text-white"
                  >
                    <FaCheck className="w-4 h-4 text-white" />
                    Accept Manually
                  </button>
                  <MannualAlert
                    isVisible={isVisible === request.id}
                    onClose={() => setIsVisable(null)}
                    request_id={request.id}
                    subject_id={request.subject.id}
                    student_id={request.student.id}
                    student_name={request.student.name}
                    subject_name={request.subject.name}
                  />
                </div>
              }

            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default RequestDetailsDropdown;
