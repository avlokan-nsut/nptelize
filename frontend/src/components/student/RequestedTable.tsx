import { useQuery } from "@tanstack/react-query";
import axios, { isAxiosError } from "axios";
import { useState } from "react";
import AlertDialog from "./AlertDialog";
import { ApiResponse } from "../../types/student/apiResponse";
import { useAuthStore } from "../../store/useAuthStore";
import { TenureSelector } from "../ui/DropDown";
import { toast } from "react-toastify";
import TableSkeleton from "../ui/TableSkeleton";

const headings = [
  "Course Code",
  "Course Name",
  "Coordinator",
  "Status",
  "Due Date",
  "Upload Certificate",
];

const FILE_SIZE_LIMIT = 2097152;
const apiUrl = import.meta.env.VITE_API_URL;


function formatDateOnly(isoString: string): string {
  if (isoString === null || isoString === undefined) {
    return "";
  }

  const date = new Date(isoString);

  const adjustedDate = new Date(date.getTime() + 330 * 60 * 1000);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return adjustedDate.toLocaleDateString("en-US", options);
}


const fetchData = async (year: number, sem: number) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const reqType = { request_types: ["pending", "rejected", "error", "no_certificate"] };
  const { data } = await axios.post<ApiResponse>(
    `${apiUrl}/student/requests`,
    reqType,
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
      params: { year, sem }
    }
  );
  const sortedRequests = data.requests.sort((a, b) => {
    const dateA = new Date(a.due_date);
    const dateB = new Date(b.due_date);
    return dateA.getTime() - dateB.getTime();
  });
  
  return {
    ...data,
    requests: sortedRequests
  };

};

const RequestedTable = () => {
  const [fileUploads, setFileUploads] = useState<Record<string, File | null>>(
    {}
  );
  const [uploadLoading, setUploadLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, { success: boolean; message: string } | null>
  >({});
  const [loadingStage, setLoadingStage] = useState<Record<string, string>>({});
  const [alertOpen, setAlertOpen] = useState(true);
  const [selectedRequestId, setselectedRequestId] = useState<string | null>(
    null
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(
    null
  );

  const [alertLoading, setAlertLoading] = useState(false);

  const { tenure } = useAuthStore();
  const year = tenure?.year;
  const sem = tenure?.is_odd; 

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["myData", year, sem],
    queryFn: () => fetchData(year as number, sem as number),
    enabled: year !== undefined && sem !== undefined,
    staleTime: 1000 * 60 * 1,
  });

  // Handle file selection for a specific request
  const handleFileChange = (requestId: string, file: File | null) => {
    setFileUploads((prev) => ({
      ...prev,
      [requestId]: file,
    }));

    // Clear any previous status when selecting a new file
    setUploadStatus((prev) => ({
      ...prev,
      [requestId]: null,
    }));
  };

  // Handle certificate submission
  const handleSubmit = async (requestId: string) => {
    const file = fileUploads[requestId];

    setUploadStatus((prev) => ({
    ...prev,
    [requestId]: null,
  }));
    if (!file) {
      setUploadStatus((prev) => ({
        ...prev,
        [requestId]: {
          success: false,
          message: "Please select a file first",
        },
      }));
      return;
    }
    if (file.size > FILE_SIZE_LIMIT) {
      setUploadStatus((prev) => ({
        ...prev,
        [requestId]: {
          success: false,
          message: "File size must be less than 2 MB",
        },
      }));
      return;
    }

    // Set loading state for this specific request
    setUploadLoading((prev) => ({
      ...prev,
      [requestId]: true,
    }));

    // Set initial loading stage
    setLoadingStage((prev) => ({
      ...prev,
      [requestId]: "Preparing certificate...",
    }));

    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Update loading stage
      setLoadingStage((prev) => ({
        ...prev,
        [requestId]: "Uploading certificate...",
      }));

      // Short delay to show the uploading stage
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Update loading stage
      setLoadingStage((prev) => ({
        ...prev,
        [requestId]: "Verifying certificate...",
      }));

      await axios.post(
        `${apiUrl}/student/certificate/upload?request_id=${requestId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Handle successful upload
      setUploadStatus((prev) => ({
        ...prev,
        [requestId]: {
          success: true,
          message: "Certificate uploaded successfully!",
        },
      }));

      // Clear the file upload state for this request
      setFileUploads((prev) => ({
        ...prev,
        [requestId]: null,
      }));

      toast.success("Certificate uploaded successfully!")

      // Refresh the data to show updated status
      refetch();
    } catch (error) {
      let errorMessage = "Failed Uploading Certificate";
      console.error("Error uploading certificate:", error);
      if (isAxiosError(error)) {
        errorMessage = error.response?.data.detail || error.message;
      }
      setUploadStatus((prev) => ({
        ...prev,
        [requestId]: {
          success: false,
          message: `${errorMessage}`,
        },
      }));

      if(errorMessage==="Student name mismatch - under review"){
        toast.error(`${errorMessage}. Please check history tab!`)
      }
      else{
        toast.error(`${errorMessage}`)
      }
      
    } finally {
      // Clear loading state
      setUploadLoading((prev) => ({
        ...prev,
        [requestId]: false,
      }));

      // Clear loading stage
      setLoadingStage((prev) => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
      refetch()
    }
  };

  const handleCertificateRequest = (request_id: string, subject_name: string) => {
    setselectedRequestId(request_id);
    setSelectedSubject(subject_name);
    setAlertOpen(false);
  };

  const handleAlertAction = async () => {
    if (selectedRequestId) {
      try {
        setAlertLoading(true);
        const response = await axios.put(
          `${apiUrl}/student/update/request-status/no-certificate?request_id=${selectedRequestId}`,
          {},
          { withCredentials: true }
        )
        if (response.status === 200) {
          setUploadStatus((prev) => ({
            ...prev,
            [selectedRequestId]: {
              success: true,
              message: "Marked as no certificate successfully!",
            },
          }));
          toast.success("Marked as no certificate successfully!")
          refetch();
        } else {
          setUploadStatus((prev) => ({
            ...prev,
            [selectedRequestId]: {
              success: false,
              message: "Failed to mark as no certificate",
            },
          }));
          toast.error("Failed to mark as no certificate")
        }
      } catch (error) {

        let errorMessage = "Failed to mark as no certificate";
        console.error("Error marking as no certificate:", error);
        if (isAxiosError(error)) {
          errorMessage = error.response?.data.detail || error.message;
        }
        setUploadStatus((prev) => ({
          ...prev,
          [selectedRequestId]: {
            success: false,
            message: `${errorMessage}`,
          },
        }));
      }

    }
    setAlertOpen(true);
    setAlertLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "no_certificate":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 text-fuchsia-800 whitespace-nowrap">
            No Certificate
          </span>

        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case "error":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );


    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="alert alert-error shadow-lg">
          <div>
            <span>{(error as any).message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (<>
      <div className="flex justify-center md:justify-end mb-6 max-w-7xl mx-auto">
        <TenureSelector />
      </div>
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100 bg-white max-w-7xl mx-auto">

        {isLoading ? (

          <TableSkeleton rows={5} cols={7} className="max-w-7xl mx-auto" />
        ): data && (
          
        <table className="table w-full">
          <thead className="bg-gray-200">
            <tr className="text-gray-600 text-sm font-medium">
              {headings.map((heading, idx) => (
                <th key={idx} className="px-6 py-4">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

            <tbody className="divide-y divide-gray-100">
              {data.requests.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 font-medium">{row.subject.code}</td>
                  <td className="px-6 py-4">{row.subject.name}</td>
                  <td className="px-6 py-4">{row.subject.teacher.name}</td>
                  <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                  <td className="px-6 py-4">{formatDateOnly(row.due_date)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex flex-col mt-8 items-center space-x-2 space-y-4 md:flex-row md:space-y-0 md:mt-0">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) =>
                            handleFileChange(
                              row.request_id,
                              e.target.files ? e.target.files[0] : null
                            )
                          }
                          className="
                            file-input file-input-sm w-[130%] max-w-xs text-sm
                            file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                            file:text-sm file:bg-blue-50 file:text-blue-600
                            hover:file:bg-blue-100 cursor-pointer
                          "
                        />
                        <button
                          className={`btn btn-sm ${uploadLoading[row.request_id] ? "loading" : ""
                            } ${fileUploads[row.request_id]
                              ? "btn-primary"
                              : "btn-neutral"
                            }`}
                          onClick={() => handleSubmit(row.request_id)}
                          disabled={
                            uploadLoading[row.request_id] ||
                            !fileUploads[row.request_id]
                          }
                        >
                          {uploadLoading[row.request_id]
                            ? "Uploading..."
                            : "Submit"}
                        </button>
                      </div>

                      {/* Loading stages display */}
                      {uploadLoading[row.request_id] &&
                        loadingStage[row.request_id] && (
                          <div className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 flex items-center">
                            <span className="loading loading-spinner loading-xs mr-2"></span>
                            {loadingStage[row.request_id]}
                          </div>
                        )}

                      {uploadStatus[row.request_id] && (
                        <div
                          className={`text-xs px-2 py-1 rounded ${uploadStatus[row.request_id]?.success
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {uploadStatus[row.request_id]?.message}
                        </div>
                      )}
                     

                      <div
                        className="text-[12px] font-bold text-center text-gray-500 cursor-pointer hover:text-blue-600 hover:underline md:text-left"
                        onClick={() => handleCertificateRequest(row.request_id, row.subject.name)}
                      >
                        Didn't receive your certificate?
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>)}
      </div>
      <AlertDialog
        isClosed={alertOpen}
        onClick={handleAlertAction}
        onStateChange={setAlertOpen}
        SubjectName={selectedSubject}
        Disabled={alertLoading}
      />
    </>
  );
};

export default RequestedTable;
