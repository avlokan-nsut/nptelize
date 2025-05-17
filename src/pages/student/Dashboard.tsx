
import RequestedTable from '../../components/student/RequestedTable'
import CompletedRequest from '../../components/student/CompletedRequest'

import { useAuthStore } from '../../store/useAuthStore';

const StudentDashboard: React.FC = () => {
   const user = useAuthStore((state) => state.user);
   const logout = useAuthStore((state) => state.logout);
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className='text-center text-2xl font-semibold text-gray-800 mb-10 tracking-wider'>Pending Requests</h1>
      <RequestedTable/>
      <hr className="my-12 h-0.5 border-t-0 bg-black" />
      <h1 className='text-center text-2xl font-semibold text-gray-800 m-10 tracking-wider'>Completed Requests</h1>
      <CompletedRequest/>

      {user ? (
        <>
          <h2>Welcome, {user.user_id}!</h2>
          <button onClick={logout}>Logout</button>
          
        </>
      ):<div>Hello</div>}
    </div>
  )
}

export default StudentDashboard