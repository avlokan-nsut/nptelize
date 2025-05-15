import React from 'react';
import ReactDOM from 'react-dom/client';
import {Route,createBrowserRouter,createRoutesFromElements , RouterProvider } from 'react-router-dom';
import App from './App';
import './index.css';
import Layout from './Layout';
import LoginForm from './components/LoginForm';
import StudentList from './pages/faculty/StudentList';
import Dashboard from './pages/faculty/Dashboard';


const routes = createBrowserRouter( 
  createRoutesFromElements(
    <Route path='/' element={<Layout />}>
      <Route index element={<App />} />
      <Route path="login" element={<LoginForm/>} />
      
      <Route path="faculty">
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students/:subjectCode" element={<StudentList />} />
      </Route>

    </Route>
  )
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={routes}/>
  </React.StrictMode>
);
