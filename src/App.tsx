import { useNotification } from "./components/notification";

function App() {
  const { showNotification } = useNotification();
  return (
    <div className="flex items-center justify-center h-screen">
      <button
        className="btn btn-primary"
        onClick={() => showNotification("This is a test!", "success")}
      >
        Notify!
      </button>
    </div>
  );
}

export default App;
