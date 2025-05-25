import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.user?.role);
  const displayRole = role === "teacher" ? "faculty" : role;
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClick = () => {
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="w-full bg-gradient-to-b from-gray-100 to-gray-200 shadow-md py-3 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        
        <a
          href="/"
          className="text-2xl font-bold tracking-tight text-gray-800 hover:text-gray-600 transition-colors duration-200"
        >
          <div className="flex flex-row justify-evenly items-center space-x-4">
          <div>AVLOKAN</div>
          <div className="hidden md:block">X</div>
          <img src= '/uni_logo.png' alt='logo' width={60} className="hidden md:block"/>
          </div>
        </a>
        

        {/* Hamburger button for mobile */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 transition-transform duration-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation/Actions for desktop */}
        <div className="hidden md:block">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">
                <div className="avatar avatar-placeholder">
                  <div className="bg-neutral text-neutral-content w-10 rounded-full">
                    <span className="text-xl">{user.name[0].toUpperCase()}</span>
                  </div>
                </div>
              </span>
              <button
                onClick={() => navigate(`${displayRole}/dashboard`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Dashboard
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              className="px-5 py-2 rounded-md bg-gray-900 text-gray-100 hover:bg-gray-700 transition-colors duration-200 shadow-sm font-semibold"
              onClick={handleClick}
            >
              Log In
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile menu dropdown */}
      <div 
        className={`md:hidden mt-3 pt-3 border-t border-gray-200 transform transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100 max-h-96 scale-y-100' : 'opacity-0 max-h-0 scale-y-95 origin-top overflow-hidden'
        }`}
      >
        {user ? (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              {/* <div className="avatar avatar-placeholder">
                <div className="bg-neutral text-neutral-content w-8 rounded-full">
                  <span>{user.name[0]}</span>
                </div>
              </div>
              <span className="text-gray-700 font-medium">{user.name}</span> */}
            </div>
            <button
              onClick={() => {
                navigate(`${displayRole}/dashboard`);
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                logout();
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            className="w-full px-3 py-2 rounded-md bg-gray-900 text-gray-100 hover:bg-gray-700 transition-colors duration-200 shadow-sm font-semibold"
            onClick={() => {
              handleClick();
              setIsMenuOpen(false);
            }}
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
