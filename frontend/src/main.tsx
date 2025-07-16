import React from "react";
import ReactDOM from "react-dom/client";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import Layout from "./Layout";
import LoginForm from "./components/LoginForm";
import StudentTable from "./components/faculty/StudentTable";
import Dashboard from "./pages/faculty/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import StudentDashboard from "./pages/student/Dashboard";
import AdminLoginForm from "./components/admin/LoginForm";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoutes";
import StudentStatus from "./components/faculty/StudentStatus";
import Developers from "./components/Developers";
import ReportSection from "./components/faculty/ReportSection";
import RejectedVerification from "./components/faculty/RejectedVerification";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LandingApp from "./components/new-landing/LandingApp";

const queryClient = new QueryClient();

const routes = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route
        path="login"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />
      <Route
        path="admin/login"
        element={
          <PublicRoute>
            <AdminLoginForm />
          </PublicRoute>
        }
      />
      <Route index element={<LandingApp />} />

      {/* Protected Routes */}

      {/* Faculty routes */}
      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route path="faculty/dashboard" element={<Dashboard />} />
        <Route
          path="faculty/students/:subjectCode"
          element={<StudentTable />}
        />
        <Route
          path="faculty/students/requests/:subjectCode"
          element={<StudentStatus />}
        />
        <Route path="faculty/report-section" element={<ReportSection />} />
        {/* <Route
          path="faculty/manual-verification"
          element={<ManualVerification />}
        /> */}
        <Route
          path="faculty/verify-rejected"
          element={<RejectedVerification />}
        />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="admin/dashboard" element={<AdminDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="student/dashboard" element={<StudentDashboard />} />
      </Route>

      <Route path="developers" element={<Developers />} />
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={routes} />
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </QueryClientProvider>
  </React.StrictMode>
);
