import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from 'react-router-dom';

const Navbar = () => {

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const navigate =  useNavigate();

  const handleClick = () =>{
    navigate("/login")
  }

  return (
    <div className="navbar bg-base-100 shadow-sm">
    <div className="flex-1">
      <a className="btn btn-ghost text-xl" href="/">Avlokan</a>
    </div>
    <div className="flex-none">
      <ul className="menu menu-horizontal px-1 text-lg font-semibold">
        <li>{user ? (
        <>
          <h2>Welcome, {user.user_id}!</h2>
          <button onClick={logout}>Logout</button>
          
        </>
      ):<button className="btn btn-neutral" onClick={handleClick}>Log In</button>}</li>
      </ul>
    </div>
  </div>

  );
};

export default Navbar;
