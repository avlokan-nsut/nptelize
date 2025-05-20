import React from 'react';
import ReactDOM from 'react-dom/client';
import {Route,createBrowserRouter,createRoutesFromElements , RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App'; 
import './index.css';
import Layout from './Layout';
import LoginForm from './components/LoginForm';
import StudentTable from './components/faculty/StudentTable';
import Dashboard from './pages/faculty/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import AdminLoginForm from './components/admin/LoginForm';
import StudentStatus from './components/faculty/StudentStatus';


const queryClient = new QueryClient();

const routes = createBrowserRouter( 
  createRoutesFromElements(
    <Route path='/' element={<Layout />}>
      <Route index element={<App />} />
      <Route path="login" element={<LoginForm/>} />
      
      {/* Faculty routes */}
      <Route path="faculty">
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students/:subjectCode" element={<StudentTable />} />
        <Route path="students/requests/:subjectCode" element={<StudentStatus />} />
      </Route>

      {/* Admin routes */}
      <Route path="admin">
        <Route path = "login" element={<AdminLoginForm />} />
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>


      <Route path = "student">
        <Route path="dashboard" element={<StudentDashboard />} />
        
      </Route>
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient} >
    <RouterProvider router={routes}/>
    </QueryClientProvider>
  </React.StrictMode>
);
