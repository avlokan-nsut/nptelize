import React from 'react';
import { Award, CheckCircle2, FileCheck } from 'lucide-react';

const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-none animate-fade-in animation-delay-800">
      {/* Main certificate */}
      <div className="relative bg-white rounded-xl shadow-2xl p-6 border border-gray-100 transform transition-transform hover:scale-[1.01] duration-500">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-8 h-8 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">NPTEL Certificate</span>
          </div>
          <span className="text-sm text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium">Verified</span>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          <div className="h-4 bg-gray-100 rounded w-4/6"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Student Name</p>
            <p className="text-sm font-medium text-gray-800">Aditya Sharma</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Certificate ID</p>
            <p className="text-sm font-medium text-gray-800">NPTEL2023CS104</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Course</p>
            <p className="text-sm font-medium text-gray-800">Data Structures</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Grade</p>
            <p className="text-sm font-medium text-gray-800">Elite + Gold</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1 text-blue-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Digitally Signed</span>
          </div>
          <p className="text-xs text-gray-500">Issued on: 15 Jun 2023</p>
        </div>
      </div>
      
      {/* Secondary elements */}
      <div className="absolute -top-3 -right-3 bg-orange-500 text-white p-3 rounded-full shadow-lg animate-pulse-slow">
        <FileCheck className="w-6 h-6" />
      </div>
      
      <div className="absolute -bottom-5 -left-5 z-10 bg-white p-3 rounded-lg shadow-lg flex items-center gap-2 border border-gray-100 animate-float">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-gray-800">Verification Complete</span>
      </div>
    </div>
  );
};

export default HeroIllustration;