import React from 'react';
import { ArrowRight, Award, FileCheck } from 'lucide-react';


interface HeroContentProps {
  title: string;
  description: string;
  ctaText: string;
  onCtaClick: () => void;
}

const HeroContent: React.FC<HeroContentProps> = ({
  title,
  description,
  ctaText,
  onCtaClick
}) => {
  return (
    <div className="z-10 text-center lg:text-left max-w-3xl mx-auto lg:mx-0">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6 animate-fade-in">
        {title}
      </h1>
      
      <p className="text-lg sm:text-xl text-gray-600 mb-8 animate-fade-in animation-delay-200">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in animation-delay-400">
        <button 
          onClick={onCtaClick} 
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          {ctaText}
          <ArrowRight className="w-5 h-5" />
        </button>
    
      </div>
      
      <div className="mt-12 flex flex-col sm:flex-row items-center gap-6 text-gray-500 justify-center lg:justify-start animate-fade-in animation-delay-600">
        
        
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          <span>Official Certificate</span>
        </div>
        
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          <span>Fast Processing</span>
        </div>
      </div>
    </div>
  );
};

export default HeroContent;