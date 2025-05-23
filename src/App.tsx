import Hero from './components/landing/Hero';
import Footer from './components/landing/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-grow">
        <Hero />
      </main>
      <Footer />
    </div>
  );
};

export default App;