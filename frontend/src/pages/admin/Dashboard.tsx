import { useState } from 'react';
import CreateStudent from '../../components/admin/CreateStudent';
// import CreateFaculty from '../../components/admin/CreateFaculty';
// import CreateAdmin from '../../components/admin/CreateAdmin';
import CreateSubject from '../../components/admin/CreateSubject';
import EnrollStudents from '../../components/admin/EnrollStudents';
import StudentTable from '../../components/admin/StudentTable';
import TeacherTable from '../../components/admin/TeacherTable';
import SubjectTable from '../../components/admin/SubjectTable';
import CreateFaculty from '../../components/admin/CreateFaculty';
import FacultySubjects from '../../components/admin/FacultySubjects';

type TabType = 
  'createStudents' | 
  'createFaculty' | 
  'createAdmins' | 
  'createSubjects' | 
  'enrollStudents' | 
  'viewStudents' | 
  'viewFaculty' | 
  'viewSubjects' |
  'facultySubjects';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('createStudents');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'createStudents':
        return <CreateStudent />;
      case 'createFaculty':
        return <CreateFaculty />;
      // case 'createAdmins':
      //   return <CreateAdmin />;
      case 'createSubjects':
        return <CreateSubject />;
      case 'enrollStudents':
        return <EnrollStudents />;
      case 'viewStudents':
        return <StudentTable />;
      case 'viewFaculty':
        return <TeacherTable />;
      case 'viewSubjects':
        return <SubjectTable />;
      case 'facultySubjects':
        return <FacultySubjects />;
      default:
        return null;
    }
  };
  
  const isViewTab = activeTab.startsWith('view');
  const isCreateTab = activeTab.startsWith('create');
  const isEnrollTab = activeTab === 'enrollStudents';
  const isFacultySubjectsTab = activeTab === 'facultySubjects';
  
  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-wider">
          Admin Dashboard
        </h1>
      </div>
      
      {/* Main Content Tabs */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-gray-200 bg-gray-50">
            <div className="flex-1">
              <nav className="flex -mb-px">
                <button 
                  className={`mr-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    isViewTab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('viewStudents')}
                >
                  View Data
                </button>
                <button 
                  className={`mr-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    isCreateTab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('createStudents')}
                >
                  Create New
                </button>
                <button 
                  className={`mr-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    isFacultySubjectsTab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('facultySubjects')}
                >
                  Allot Faculty
                </button>
                <button 
                  className={`mr-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    isEnrollTab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('enrollStudents')}
                >
                  Enroll Students
                </button>
                
              </nav>
            </div>
          </div>
          
          {/* Sub Navigation */}
          {isViewTab && (
            <div className="bg-white px-6 py-2 border-b border-gray-200">
              <div className="flex space-x-4">
                <button
                  className={`px-3 py-2 text-sm rounded-md ${
                    activeTab === 'viewStudents' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('viewStudents')}
                >
                  Students
                </button>
                <button
                  className={`px-3 py-2 text-sm rounded-md ${
                    activeTab === 'viewFaculty' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('viewFaculty')}
                >
                  Faculty
                </button>
                <button
                  className={`px-3 py-2 text-sm rounded-md ${
                    activeTab === 'viewSubjects' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('viewSubjects')}
                >
                  Subjects
                </button>
              </div>
            </div>
          )}
          
          {isCreateTab && (
            <div className="bg-white px-6 py-2 border-b border-gray-200">
              <div className="flex space-x-4">
                <button
                  className={`px-3 py-2 text-sm rounded-md ${
                    activeTab === 'createStudents' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('createStudents')}
                >
                  Students
                </button>
                <button
                  className={`px-3 py-2 text-sm rounded-md ${
                    activeTab === 'createFaculty' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('createFaculty')}
                >
                  Faculty
                </button>
                {/* <button
                  className={`px-3 py-2 text-sm rounded-md ${
                    activeTab === 'createAdmins' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('createAdmins')}
                >
                  Admins
                </button> */}
                <button
                  className={`px-3 py-2 text-sm rounded-md ${
                    activeTab === 'createSubjects' 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab('createSubjects')}
                >
                  Subjects
                </button>
              </div>
            </div>
          )}
          
          {/* Content Area */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
