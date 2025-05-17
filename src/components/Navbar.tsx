import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.user?.role);
  const displayRole = role === "teacher" ? "faculty" : role;
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/login");
  };

  return (
    <nav className="w-full bg-gradient-to-b from-gray-100 to-gray-200 shadow-md py-3 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="text-2xl font-bold tracking-tight text-gray-800 hover:text-gray-600 transition-colors duration-200"
        >
          Avlokan
        </a>

        {/* Navigation/Actions */}
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">
                <div className="avatar avatar-placeholder">
                  <div className="bg-neutral text-neutral-content w-10  rounded-full">
                    <span className="text-xl">{user.name[0]}</span>
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
    </nav>
  );
};

export default Navbar;
