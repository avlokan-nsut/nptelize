import { useParams } from "react-router-dom";
import StudentTable from "../../components/faculty/StudentTable";

const StudentList = () => {
  // Extract the subject code from URL parameters
  const { subjectCode = "FECS01" } = useParams<{ subjectCode?: string }>();

  return (
    <div className="mx-auto px-4 py-8">
      <h1 className="text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
        Student List
      </h1>
      <StudentTable subjectCode={subjectCode} />
    </div>
  );
};

export default StudentList;