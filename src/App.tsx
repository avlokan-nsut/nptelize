import LoginForm from "./components/LoginForm";
import Navbar from "./components/Navbar";
// import History from "./components/student/History";
// import Dashboard from "./pages/student/Dashboard";
import Dashboard from "./pages/faculty/Dashboard";
function App() {
 
  return (
    <div >
      <Navbar/>
      {/* <Dashboard/>
      <History/> */}
      <Dashboard />
    </div>
  );
}

export default App;
