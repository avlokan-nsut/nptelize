import React from 'react';
import Hero from './components/landing/Hero';
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";

const App = () => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const role = useAuthStore((state) => state.user?.role);

    const handleClick = () => {
        if (user) {
            // Redirect to dashboard based on user role
            navigate(`/${role}/dashboard`);
        } else {
            // Redirect to login if not logged in
            navigate("/login");
        }
    };

    return (
    <div className=" bg-white">
      
      <main>
        <Hero />
      </main>
    </div>
  );
}

export default App;