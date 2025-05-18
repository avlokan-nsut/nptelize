import Table from "../../components/faculty/Table";
import Request from "../../components/faculty/Request";

const Dashboard = () => {
  return (
    <div className="mx-auto px-4 py-8">
      <h1 className="text-center text-xl md:text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
        Alloted Subjects
      </h1>
      <Table />
      <div className="flex justify-center mt-4">
        <Request/>
      </div>
    </div>
  );
};

export default Dashboard;
