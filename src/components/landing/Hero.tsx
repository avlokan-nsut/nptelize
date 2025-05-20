import React from 'react';

import HeroBackground from './HeroBackground';
import HeroContent from './HeroContent';
import HeroIllustration from './HeroIllustration';


import { useNavigate } from 'react-router-dom';


const Hero: React.FC = () => {
  const handleCtaClick = () => {
    
    const navigate = useNavigate();

    navigate(`/login`);
    // Here you would normally handle the navigation or form display
  };

  return (
    <section className="relative min-h-[90vh] w-full flex items-center overflow-hidden">
      <HeroBackground />
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <HeroContent 
            title="Simplify Your NPTEL Certificate Submission"
            description="Avlokan streamlines the verification and submission process for your NPTEL certificates. Get your achievements recognized quickly and securely."
            ctaText="Submit Certificates"
            onCtaClick={handleCtaClick}
          />
          
          <div className="lg:ml-auto order-first lg:order-last">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;