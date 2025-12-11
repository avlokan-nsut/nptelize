import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";

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
    <div className="pt-6 px-6">
      <nav className="bg-white/90 backdrop-blur-md border border-gray-200/30  px-8 py-4 max-w-6xl mx-auto shadow-lg shadow-black/5 transition-all duration-300 ease-in-out rounded-3xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="text-2xl font-bold tracking-tight text-gray-800 hover:text-gray-600 transition-colors duration-200"
          >
            <div className="flex flex-row justify-evenly items-center space-x-4">
              <img src='/avlokan_logo.jpg' alt='logo' width={50} className="rounded-2xl" />
              <div className="hidden md:block">X</div>
              <img src='/uni_logo.png' alt='logo' width={50} className="hidden md:block" />
            </div>
          </a>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`/${displayRole}/dashboard`)}
                  className="bg-[#003566] hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-full transition-colors duration-200 flex items-center space-x-2 hover:cursor-pointer"
                >
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={logout}
                  className="bg-black hover:bg-gray-500 text-black font-semibold px-6 py-2.5 rounded-full transition-colors duration-200 flex items-center space-x-2 hover:cursor-pointer"
                >
                  <span><LogOut className="size-5 text-white" /></span>
                </button>
              </div>
            ) : (
              <button
                className="bg-black hover:bg-gray-600 text-white font-semibold font-hero px-6 py-2.5 rounded-full transition-colors duration-200 flex items-center space-x-2 hover:cursor-pointer"
                onClick={handleClick}
              >
                <span>Log In</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="relative md:hidden p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <div className="relative size-6">
              <X
                className={`absolute top-0 left-0 size-6 transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-0'
                  }`}
              />
              <Menu
                className={`absolute top-0 left-0 size-6 transition-opacity duration-200 ${isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
              />
            </div>
          </button>

        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen
          ? 'max-h-96 opacity-100'
          : 'max-h-0 opacity-0'
          }`}>
          <div className="mt-4 pt-4 border-t border-gray-200/30">
            <div className="flex flex-col space-y-3">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      navigate(`/${displayRole}/dashboard`);
                      setIsMenuOpen(false);
                    }}
                    className="bg-[#003566] hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-full transition-colors duration-200 flex items-center justify-center space-x-2 hover:cursor-pointer"
                  >
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="bg-black hover:bg-gray-500 text-white font-semibold px-6 py-2.5 rounded-full transition-colors duration-200 flex items-center justify-center space-x-2 hover:cursor-pointer"
                  >
                    <LogOut className="size-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  className="bg-black hover:bg-gray-500 text-white font-semibold px-6 py-2.5 rounded-full transition-colors duration-200 flex items-center justify-center space-x-2 hover:cursor-pointer"
                  onClick={() => {
                    handleClick();
                    setIsMenuOpen(false);
                  }}
                >
                  <span>Log In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
