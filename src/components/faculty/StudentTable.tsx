import { FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useMemo } from "react";

interface StudentTableProps {
  subjectCode: string;
}

const headings = [
  "Student Name",
  "NSUT Roll No.",
  "NPTEL Roll No.",
  "Total Marks",
  "Result",
  "Status",
  "Remarks",
];

// Sample student data with subject code
const allStudents = [
  {
    name: "Deepak Kumar Mandal",
    nsutRoll: "2021UCS1522",
    nptelRoll: "-",
    totalMarks: "-",
    result: "Pending",
    status: "pending",
    remarks: "-",
    subjectCode: "FECS01",
  },
  {
    name: "aakshat malhotra",
    nsutRoll: "2021UCS1555",
    nptelRoll: "-",
    totalMarks: "-",
    result: "Pending",
    status: "pending",
    remarks: "-",
    subjectCode: "FECS01",
  },
  {
    name: "komal",
    nsutRoll: "2021UCS1517",
    nptelRoll: "-",
    totalMarks: "-",
    result: "Pending",
    status: "pending",
    remarks: "-",
    subjectCode: "FECS01",
  },
  {
    name: "Khushal Yadav",
    nsutRoll: "2021UCS1542",
    nptelRoll: "-",
    totalMarks: "-",
    result: "Pending",
    status: "pending",
    remarks: "-",
    subjectCode: "FECS01",
  },
  {
    name: "chirag saini",
    nsutRoll: "2021UCS1501",
    nptelRoll: "-",
    totalMarks: "-",
    result: "Pending",
    status: "pending",
    remarks: "-",
    subjectCode: "FECS01",
  },
  {
    name: "Deepika",
    nsutRoll: "2021UCS1540",
    nptelRoll: "-",
    totalMarks: "-",
    result: "Pending",
    status: "pending",
    remarks: "-",
    subjectCode: "FECS01",
  },
  {
    name: "John Doe",
    nsutRoll: "2021UCS1601",
    nptelRoll: "-",
    totalMarks: "-",
    result: "Pending",
    status: "pending",
    remarks: "-",
    subjectCode: "DNCS04",
  },
];

const Table: React.FC<StudentTableProps> = function ({ subjectCode = "FECS01" }) {
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => student.subjectCode === subjectCode);
  }, [subjectCode]);

  return (
    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-100 bg-white max-w-7xl mx-auto">
      <div className="flex items-center p-4 border-b">
        <Link to="/faculty/dashboard">
          <FaArrowLeft className="text-xl mr-2" />
        </Link>
        <h2 className="text-xl font-semibold">{subjectCode}</h2>
      </div>
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
          {filteredStudents.length > 0 ? (
            filteredStudents.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="px-6 py-4 text-center">{row.name}</td>
                <td className="px-6 py-4 text-center">{row.nsutRoll}</td>
                <td className="px-6 py-4 text-center">{row.nptelRoll}</td>
                <td className="px-6 py-4 text-center">{row.totalMarks}</td>
                <td className="px-6 py-4 text-center">{row.result}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        row.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : row.status === "notverified"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">{row.remarks}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center">
                No students found for this subject code
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
