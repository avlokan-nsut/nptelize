// components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-200 text-gray-700 h-[60px] flex items-center mt-auto border-t border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 w-full">
        <div className="flex justify-between items-center h-full">
          {/* Copyright */}
          <div className="text-gray-700 text-sm font-light tracking-wide flex-col ">
            © {new Date().getFullYear()} <span className="font-medium">Avlokan</span>. 
            <div>All rights reserved.</div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <a 
              href="/developers" 
              className="text-gray-700 hover:text-gray-900 transition-all duration-200 text-sm font-normal tracking-wide relative group"
            >
              Meet Our Team
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </a>
            {/* You can add more links here if needed */}
            {/*
            <a 
              href="/privacy" 
              className="text-gray-600 hover:text-gray-900 transition-all duration-200 text-sm font-normal tracking-wide relative group"
            >
              Privacy Policy
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </a>
            */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;