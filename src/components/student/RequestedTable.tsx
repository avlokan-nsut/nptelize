import { useQuery } from "@tanstack/react-query";
import axios from "axios";


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
    request_types: ["pending"],
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
  return data;
};

const RequestedTable = () => {
  const { data, error, isLoading } = useQuery({
  queryKey: ["myData"],
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
                <label className="flex items-center justify-center space-x-2">
                  <input
                    type="file"
                    className="
                      file-input file-input-sm w-[65%] max-w-xs text-sm
                      file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                      file:text-sm file:bg-blue-50 file:text-blue-600
                      hover:file:bg-blue-100 cursor-pointer
                    "
                  />
                  <button className="btn btn-sm btn-neutral">Submit</button>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

  )};
};

export default RequestedTable;
