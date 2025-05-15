import { useState } from 'react';
import CreateStudent from '../../components/admin/CreateStudent';
import CreateFaculty from '../../components/admin/CreateFaculty';
import CreateAdmin from '../../components/admin/CreateAdmin';
import CreateSubject from '../../components/admin/CreateSubject';

type TabType = 'dashboard' | 'students' | 'faculty' | 'admins' | 'subjects';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'students':
        return <CreateStudent />;
      case 'faculty':
        return <CreateFaculty />;
      case 'admins':
        return <CreateAdmin />;
      case 'subjects':
        return <CreateSubject />;
      default:
        return null;
    }
  };
  
  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-wider">
          Admin Dashboard
        </h1>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button 
          className={`py-2 px-6 font-medium whitespace-nowrap ${activeTab === 'students' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('students')}
        >
          Create Students
        </button>
        <button 
          className={`py-2 px-6 font-medium whitespace-nowrap ${activeTab === 'faculty' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('faculty')}
        >
          Create Faculty
        </button>
        <button 
          className={`py-2 px-6 font-medium whitespace-nowrap ${activeTab === 'admins' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('admins')}
        >
          Create Admins
        </button>
        <button 
          className={`py-2 px-6 font-medium whitespace-nowrap ${activeTab === 'subjects' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('subjects')}
        >
          Create Subjects
        </button>
      </div>
      
      {/* Content Area */}
      <div className="bg-white p-6 rounded-lg shadow">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;
