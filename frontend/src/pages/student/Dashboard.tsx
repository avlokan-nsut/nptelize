import { useState } from 'react'
import RequestedTable from '../../components/student/RequestedTable'
import CompletedRequest from '../../components/student/CompletedRequest'
import History from '../../components/student/History'

const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'history'>('pending')
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-center mb-8">
        <div className="flex space-x-4 border-b">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'pending' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Requests
          </button>
          {/* <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'completed' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Completed Requests
          </button> */}
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'history' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'pending' && (
          <div>
            
            <RequestedTable />
          </div>
        )}
        
        {activeTab === 'completed' && (
          <div>
    
            <CompletedRequest />
          </div>
        )}
        
        {activeTab === 'history' && (
          <div>
            
            <History />
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentDashboard