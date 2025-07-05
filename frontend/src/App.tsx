import Hero from './components/landing/Hero';
import Footer from './components/landing/Footer';
import { useAuthStore } from './store/useAuthStore';
import { useEffect } from 'react';

const App: React.FC = () => {

  const checkSession = useAuthStore((state) => state.checkSession);

   useEffect(() => {
    
    checkSession();
  }, [checkSession]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <Hero />
      </main>
      <Footer />
    </div>
  );
};

export default App;