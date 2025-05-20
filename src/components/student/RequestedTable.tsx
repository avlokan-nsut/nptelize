import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

const headings = [
  "Subject Code",
  "Subject Name",
  "Coordinator",
  "Due Date",
  "Upload Certificate",
];

export type Teacher = {
  id: string;
  name: string;
};

export type Subject = {
  id: string;
  code: string;
  name: string;
  teacher: Teacher;
};

export type Request = {
  request_id: string;
  subject: Subject;
  status: string;
  due_date: string; 
};

export type ApiResponse = {
  requests: Request[];
};

function formatDateOnly(isoString: string): string {

  if(isoString === null || isoString === undefined){
    return "";
  }

  const date = new Date(isoString);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString('en-US', options);
}

const fetchData = async () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const reqType = {
    request_types: ["pending", "rejected"],
  };

  const { data} = await axios.post<ApiResponse>(
  `${apiUrl}/student/requests`,
  reqType,
  {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  
);
console.log(data)
  return data;
};

const RequestedTable = () => {
  const [fileUploads, setFileUploads] = useState<Record<string, File | null>>({});
  const [uploadLoading, setUploadLoading] = useState<Record<string, boolean>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, { success: boolean; message: string } | null>>({});

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["myData"],
    queryFn: fetchData,
    staleTime: 1000 * 60 * 1, 
  });

  // Handle file selection for a specific request
  const handleFileChange = (requestId: string, file: File | null) => {
    setFileUploads(prev => ({
      ...prev,
      [requestId]: file
    }));
    
    // Clear any previous status when selecting a new file
    setUploadStatus(prev => ({
      ...prev,
      [requestId]: null
    }));
  };

  // Handle certificate submission
  const handleSubmit = async (requestId: string) => {
    const file = fileUploads[requestId];
    if (!file) {
      setUploadStatus(prev => ({
        ...prev,
        [requestId]: { 
          success: false, 
          message: "Please select a file first" 
        }
      }));
      return;
    }

    // Set loading state for this specific request
    setUploadLoading(prev => ({
      ...prev,
      [requestId]: true
    }));

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(
        `${apiUrl}/student/certificate/upload?request_id=${requestId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Handle successful upload
      setUploadStatus(prev => ({
        ...prev,
        [requestId]: { 
          success: true, 
          message: "Certificate uploaded successfully!" 
        }
      }));

      // Clear the file upload state for this request
      setFileUploads(prev => ({
        ...prev,
        [requestId]: null
      }));

      // Refresh the data to show updated status
      refetch();

    } catch (error) {
      console.error("Error uploading certificate:", error);
      setUploadStatus(prev => ({
        ...prev,
        [requestId]: { 
          success: false, 
          message: "Failed to upload certificate. Please try again." 
        }
      }));
    } finally {
      // Clear loading state
      setUploadLoading(prev => ({
        ...prev,
        [requestId]: false
      }));
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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center ">
       <span className="loading loading-ring loading-xl"></span>
      </div>
    );
  }

  if(data){
    return (
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100 bg-white max-w-7xl mx-auto">
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
                <td className="px-6 py-4">{formatDateOnly(row.due_date)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(row.request_id, e.target.files ? e.target.files[0] : null)}
                        className="
                          file-input file-input-sm w-[65%] max-w-xs text-sm
                          file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                          file:text-sm file:bg-blue-50 file:text-blue-600
                          hover:file:bg-blue-100 cursor-pointer
                        "
                      />
                      <button 
                        className={`btn btn-sm ${uploadLoading[row.request_id] ? 'loading' : ''} ${fileUploads[row.request_id] ? 'btn-primary' : 'btn-neutral'}`}
                        onClick={() => handleSubmit(row.request_id)}
                        disabled={uploadLoading[row.request_id] || !fileUploads[row.request_id]}
                      >
                        {uploadLoading[row.request_id] ? 'Uploading...' : 'Submit'}
                      </button>
                    </div>
                    
                    {uploadStatus[row.request_id] && (
                      <div className={`text-xs px-2 py-1 rounded ${uploadStatus[row.request_id]?.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {uploadStatus[row.request_id]?.message}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  };
};

export default RequestedTable;
