
import RequestedTable from '../../components/student/RequestedTable'
import CompletedRequest from '../../components/student/CompletedRequest'



const StudentDashboard: React.FC = () => {
   
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className='text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider'>Pending Requests</h1>
      <RequestedTable/>
      <hr className="my-12 h-0.5 border-t-0 bg-black" />
      <h1 className='text-center text-2xl font-semibold text-gray-800 m-10 tracking-wider'>Completed Requests</h1>
      <CompletedRequest/>
    </div>
  )
}

export default StudentDashboard