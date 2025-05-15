import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const headings = [
  "Subject Code",
  "Subject Name",
  "Due Date",
  "Total students",
  "Verified",
  "Not Verified",
  "Not Submitted",
];

const data = [
  {
    code: "DNCS04",
    name: "Social Networks",
    duedate: "18/12/2025",
    totalstudents: 7,
    verified: 3,
    notverified: 2,
    notsubmitted: 1,
  },
  {
    code: "FECS01",
    name: "Computer Science Fundamentals",
    duedate: "20/12/2025",
    totalstudents: 6,
    verified: 0,
    notverified: 0,
    notsubmitted: 6,
  }
];

const Table = function () {
  return (
    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100 bg-white max-w-7xl mx-auto">
      <table className="table w-full">
        <thead className="">
          <tr className="text-sm font-medium">
            {headings.map((heading, idx) => (
              <th key={idx} className="px-6 py-4 text-center">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-gray-50 transition-colors duration-200"
            >
              <td className="px-6 py-4 text-center">{row.code}</td>
              <td className="px-6 py-4 text-center">{row.name}</td>
              <td className="px-6 py-4 text-center">{row.duedate}</td>
              <td className="px-6 py-4 text-center">{row.totalstudents}</td>
              <td className="px-6 py-4 text-center">{row.verified}</td>
              <td className="px-6 py-4 text-center">{row.notverified}</td>
              <td className="px-6 py-4 text-center">{row.notsubmitted}</td>
              <td>
                <Link to={`/faculty/students/${row.code}`} className="btn btn-primary border-none bg-black">
                  <FaArrowRight className="ml-2 text-xl text-white" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
