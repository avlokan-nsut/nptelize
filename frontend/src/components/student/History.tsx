import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const headings = [
  "Subject Code",
  "Subject Name",
  "Coordinator",
  "Status",
  "Submitted Date",
  "Due Date",
  "Actions",
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
  subject: Subject;
  status: string;
  due_date: string;
  certificate_uploaded_at: string;
  request_id: string;
};

export type ApiResponse = {
  requests: Request[];
};
const apiUrl = import.meta.env.VITE_API_URL;

const fetchData = async () => {
  const reqType = {
    request_types: ["processing", "completed", "rejected", "error"],
  };

  const { data } = await axios.post<ApiResponse>(
    `${apiUrl}/student/requests`,
    reqType,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  console.log(data);

  return data;
};

function formatDateOnly(isoString: string): string {
  if (isoString === null || isoString === undefined) {
    return "";
  }

  const date = new Date(isoString);

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return date.toLocaleDateString("en-US", options);
}

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
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
  };

const RequestedTable = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["myDataHistory"],
    queryFn: fetchData,
    staleTime: 1000 * 60 * 1,
  });

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

  if (data) {
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
                <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                {/* <td className="px-6 py-4">{row.submitted_date || 'N/A'}</td> */}
                <td className="px-6 py-4">
                  {formatDateOnly(row.certificate_uploaded_at) || "N/A"}
                </td>
                <td className="px-6 py-4">
                  {formatDateOnly(row.due_date) || "N/A"}
                </td>

                <td className="px-6 py-4">
                    {row.status==='completed' && (
                  <div className=" text-black py-2 rounded-md shadow-md transition-all duration-300 transform hover:scale-105 hover:bg-black hover:text-white">
                    <a
                      href={`${apiUrl}/user/certificate/file/${row.request_id}.pdf?download=false`}
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
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
};

export default RequestedTable;
