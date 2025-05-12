import React from "react";
import Pagination from "./Pagination";


type Data = {
  subject_code: string;
  subject_name: string;
  coordinator: string;
  status: string;
  submitted_date: string;
  due_date: string;
};

const data: Data[] = [
  {
    subject_code: "CS101",
    subject_name: "Introduction to Programming",
    coordinator: "Dr. Anita Sharma",
    status: "Submitted",
    submitted_date: "2025-05-01",
    due_date: "2025-05-05"
  },
  {
    subject_code: "CS101",
    subject_name: "Introduction to Programming",
    coordinator: "Dr. Anita Sharma",
    status: "Submitted",
    submitted_date: "2025-05-01",
    due_date: "2025-05-05"
  },
  {
    subject_code: "CS101",
    subject_name: "Introduction to Programming",
    coordinator: "Dr. Anita Sharma",
    status: "Submitted",
    submitted_date: "2025-05-01",
    due_date: "2025-05-05"
  },
  
  
  
];

const PAGE_SIZE = 15;

export default function History() {
  const [page, setPage] = React.useState(1);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);

  const paginatedData = React.useMemo(
    () => data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page]
  );

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className='text-center text-2xl font-semibold text-gray-800 mb-5 tracking-wider'>History</h1>
    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100 bg-white max-w-7xl mx-auto">
      <table className="table w-full">
        <thead className="bg-gray-200">
          <tr className="text-gray-600 text-sm font-medium">
            <th>Subject code</th>
            <th>Subject Name</th>
            <th>Coordinator</th>
            <th>Status</th>
            <th>Submitted Date</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {paginatedData.map((row, idx) => (
            <tr key={idx}>
              <td>{row.subject_code}</td>
              <td>{row.subject_name}</td>
              <td>{row.coordinator}</td>
              <td>{row.status}</td>
              <td>{row.submitted_date}</td>
              <td>{row.due_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        totalPages={totalPages}
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
    </div>
  );
}
