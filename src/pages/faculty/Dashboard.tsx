import Table from "../../components/faculty/Table";


const Dashboard = () => {
  return (
    <div className="mx-auto px-4 py-8">
      <h1 className="text-center text-xl md:text-2xl font-semibold text-gray-800 mb-10 tracking-wider">
        Alloted Subjects
      </h1>
      <Table />
    </div>
  );
};

export default Dashboard;
