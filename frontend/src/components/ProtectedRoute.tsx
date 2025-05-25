import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore"; // adjust path accordingly

interface ProtectedRouteProps {
    allowedRoles: string[];
    redirectPath?: string;
}

const ProtectedRoute = ({
    allowedRoles,
    redirectPath = "/login",
}: ProtectedRouteProps) => {
    const user = useAuthStore((state) => state.user);
    const location = useLocation();

    if (!user) {
        const isAdminRoute = location.pathname.startsWith("/admin");
        const isFacultyRoute = location.pathname.startsWith("/faculty");
        const isStudentRoute = location.pathname.startsWith("/student");

        if (isAdminRoute) return <Navigate to="/admin/login" replace />;
        if (isFacultyRoute) return <Navigate to="/login" replace />;
        if (isStudentRoute) return <Navigate to="/login" replace />;

        return <Navigate to={redirectPath} replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
