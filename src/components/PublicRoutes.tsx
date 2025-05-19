import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

interface PublicRouteProps {
    children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
    const user = useAuthStore((state) => state.user);

    if (user) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PublicRoute;
