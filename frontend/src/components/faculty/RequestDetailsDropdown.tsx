import { useMemo } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaTimes, FaCheck, FaInfoCircle } from "react-icons/fa";
import { Request } from "./StudentStatus";
import { CertificateApiResponse } from "../../types/faculty/MannualVerification";

const apiUrl = import.meta.env.VITE_API_URL;

interface RequestDetailsDropdownProps {
  request: Request;
  colSpan: number;
  subjectId: string;
  onClose: () => void;
}

// Helper to format date
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

// Helper to get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>;
    case "rejected":
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>;
    case "no_certificate":
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-fuchsia-800">No Certificate</span>;
    case "under_review":
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Under Review</span>;
    default:
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
  }
};

const RequestDetailsDropdown = ({ request, colSpan, subjectId, onClose }: RequestDetailsDropdownProps) => {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ["teacherRequestsStudents", subjectId] });
      onClose();
    } catch (e) {
      console.error('Accept failed:', e);
      alert("Accept failed");
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(`${apiUrl}/teacher/reject/certificate?request_id=${request.id}`, {}, { withCredentials: true });
      queryClient.invalidateQueries({ queryKey: ["teacherRequestsStudents", subjectId] });
      onClose();
    } catch (e) {
      alert("Reject failed");
    }
  };

  // Create a mapping for student information fields
  const studentInfoFields = [
    { label: "Name", value: request.student.name },
    { label: "Roll Number", value: request.student.roll_number },
    { label: "Email", value: request.student.email, className: "text-sm" },
    { label: "Status", value: getStatusBadge(request.status) },
    { label: "Due Date", value: formatDate(request.due_date) },
  ];

  // Create a mapping for subject information fields
  const subjectInfoFields = [
    { label: "Subject", value: request.subject.name },
    { label: "Subject Code", value: request.subject.subject_code },
    { label: "NPTEL Code", value: request.subject.nptel_course_code },
    { label: "Current Marks", value: request.verified_total_marks || 'Not set', className: "badge badge-outline" },
  ];

  // Create a mapping for certificate field labels
  const certificateFields = [
    { key: "student_name", label: "Name" },
    { key: "marks", label: "Marks" },
    { key: "course_name", label: "Course" },
    { key: "course_period", label: "Period" },
  ];

  // Function to render certificate details section
  const renderCertificateDetails = (certificate: any, title: string) => {
    if (!certificate) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">{title}</h4>
        <div className="text-sm space-y-1">
          {certificateFields.map((field, index) => (
            <div key={index}>
              <strong>{field.label}:</strong> {certificate[field.key] || 'N/A'}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <tr>
      <td colSpan={colSpan} className="px-0 py-0">
        <div className="bg-base-100 border-t border-gray-200">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Information */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                  <h3 className="card-title text-lg text-primary">Student Information</h3>
                  <div className="space-y-2">
                    {studentInfoFields.map((field, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-medium">{field.label}:</span>
                        <span className={field.className}>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subject Information */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                  <h3 className="card-title text-lg text-secondary">Subject Information</h3>
                  <div className="space-y-2">
                    {subjectInfoFields.map((field, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-medium">{field.label}:</span>
                        <span className={field.className}>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Information */}
            <div className="card bg-base-100 shadow-sm mt-6">
              <div className="card-body p-4">
                <h3 className="card-title text-lg text-accent">Certificate Details</h3>
                {certLoading ? (
                  <div className="flex items-center gap-2 text-gray-500"><span className="loading loading-spinner loading-sm"></span>Loading certificate details...</div>
                ) : certData?.data ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderCertificateDetails(certData.data.uploaded_certificate, "Uploaded Certificate")}
                    {certData.data.verification_certificate && 
                      renderCertificateDetails(certData.data.verification_certificate, "Verification Certificate")}
                    <div className="md:col-span-2 mt-2">
                      <div><strong>Remark:</strong> <span className="text-gray-600">{certData.data.remark || 'No remarks'}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="alert"><FaInfoCircle className="w-6 h-6" /><span>No certificate uploaded yet. Current marks: {request.verified_total_marks || 'Not set'}</span></div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
              <button onClick={handleReject} className="btn btn-error btn-sm gap-2 text-white"><FaTimes className="w-4 h-4 text-white" />Reject</button>
              <button onClick={handleAccept} className="btn btn-success btn-sm gap-2 text-white"><FaCheck className="w-4 h-4 text-white" />Accept</button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default RequestDetailsDropdown;
