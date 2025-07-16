
import { useEffect } from 'react';
import Footer from './Footer';
import { useAuthStore } from '../../store/useAuthStore';
import Background from './Background';
import Hero from './Hero';
import Counter from './Counter';
import Features from './Features';
import Testimonials from './Testimonials';
import Team from './Team';

const LandingApp: React.FC = () => {

  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {

    checkSession();
  }, [checkSession]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className='flex-grow font-hero'>
        <Background />
        <Hero/>
        <Counter/>
        <Features/>
        <Testimonials/>
        <Team/>
      </main>
      <Footer />
    </div>
  );
};

export default LandingApp;