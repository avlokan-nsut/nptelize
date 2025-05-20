import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";

const App = () => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const role = useAuthStore((state) => state.user?.role);

    const handleClick = () => {
        if (user) {
            // Redirect to dashboard based on user role
            navigate(`/${role}/dashboard`);
        } else {
            // Redirect to login if not logged in
            navigate("/login");
        }
    };

    return (
        <div className="pt-20 bg-white flex flex-col">
            {/* Hero Section - Single Page */}
            <main className="flex-grow container mx-auto px-6 flex items-center">
                <div className="w-full flex flex-col md:flex-row items-center gap-8">
                    {/* Text Content */}
                    <div className="w-full md:w-1/2">
                        <h1 className="text-6xl font-bold mb-4">
                            Avlokan
                        </h1>
                        <h2 className="text-3xl font-medium mb-6">
                            One stop for certificate verification
                        </h2>
                        <p className="text-xl text-gray-700 mb-8 max-w-lg">
                            Simplify the verification process for NPTEL certificates and
                            other academic credentials. Fast, secure, and reliable.
                        </p>
                        <div className="mt-6">
                            <button 
                                className="bg-black text-white py-3 px-8 text-lg rounded-md hover:bg-gray-800"
                                onClick={handleClick}
                            >
                                {user ? "Get Started" : "Log In"}
                            </button>
                        </div>
                    </div>

                    {/* Improved SVG Illustration */}
                    <div className="w-full md:w-1/2">
                        <svg
                            viewBox="0 0 600 400"
                            className="w-full h-auto"
                            stroke="black"
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            {/* Background decorative elements */}
                            <circle cx="120" y="70" r="8" opacity="0.2" fill="black" />
                            <circle cx="520" y="300" r="12" opacity="0.1" fill="black" />
                            <circle cx="480" y="80" r="6" opacity="0.15" fill="black" />
                            <path d="M80,180 L100,160 L120,180 L100,200 Z" opacity="0.1" fill="black" strokeWidth="1" />
                            <path d="M530,120 L550,100 L570,120 L550,140 Z" opacity="0.1" fill="black" strokeWidth="1" />
                            
                            {/* Main certificate with subtle shadow */}
                            <rect x="100" y="180" width="200" height="150" rx="4" fill="white" stroke="black" strokeWidth="2" />
                            <rect x="102" y="182" width="196" height="146" rx="3" fill="white" stroke="black" strokeWidth="0.5" opacity="0.7" />
                            <line x1="120" y1="215" x2="280" y2="215" strokeWidth="1.5" />
                            <line x1="120" y1="245" x2="280" y2="245" strokeWidth="1.5" />
                            <line x1="120" y1="275" x2="220" y2="275" strokeWidth="1.5" />
                            <circle cx="250" y="305" r="18" stroke="black" strokeWidth="1.5" fill="none" />
                            <path d="M235,305 C235,295 265,295 265,305" stroke="black" strokeWidth="1.5" fill="none" />
                            
                            {/* Person sitting with smoother lines */}
                            <circle cx="350" y="180" r="28" fill="white" stroke="black" strokeWidth="2" /> {/* Head */}
                            <path d="M340,180 C340,175 345,170 350,170 C355,170 360,175 360,180" stroke="black" strokeWidth="1" fill="none" /> {/* Smile */}
                            <rect x="322" y="208" width="56" height="75" rx="6" fill="white" stroke="black" strokeWidth="2" /> {/* Body */}
                            <path d="M322,245 L300,245 L305,215" stroke="black" strokeWidth="2" fill="none" strokeLinejoin="round" /> {/* Left arm */}
                            <path d="M378,225 L410,205 L420,225" stroke="black" strokeWidth="2" fill="none" strokeLinejoin="round" /> {/* Right arm */}
                            <path d="M328,283 L328,350 L348,350" stroke="black" strokeWidth="2" fill="none" /> {/* Left leg */}
                            <path d="M372,283 L372,350 L352,350" stroke="black" strokeWidth="2" fill="none" /> {/* Right leg */}
                            
                            {/* Computer with refined details */}
                            <rect x="420" y="150" width="110" height="75" rx="4" fill="white" stroke="black" strokeWidth="2" /> {/* Screen */}
                            <rect x="420" y="130" width="110" height="20" rx="4" fill="white" stroke="black" strokeWidth="2" /> {/* Top bar */}
                            <circle cx="435" y="140" r="3" fill="black" />
                            <circle cx="448" y="140" r="3" fill="black" />
                            
                            {/* Certificate on screen */}
                            <rect x="435" y="160" width="80" height="55" rx="2" fill="white" stroke="black" strokeWidth="1" /> 
                            <line x1="445" y1="175" x2="505" y2="175" strokeWidth="1" />
                            <line x1="445" y1="190" x2="505" y2="190" strokeWidth="1" />
                            <line x1="445" y1="205" x2="485" y2="205" strokeWidth="1" />
                            
                            {/* Stack of books with better dimension */}
                            <path d="M270,325 L350,325 L345,310 L265,310 Z" fill="white" stroke="black" strokeWidth="1.5" />
                            <path d="M265,310 L345,310 L340,295 L260,295 Z" fill="white" stroke="black" strokeWidth="1.5" />
                            <path d="M260,295 L340,295 L335,280 L255,280 Z" fill="white" stroke="black" strokeWidth="1.5" />
                            
                            {/* Abstract decorative patterns */}
                            <path d="M50,120 C80,100 100,150 130,120" stroke="black" strokeWidth="1" opacity="0.6" fill="none" />
                            <path d="M550,200 C520,180 500,220 470,200" stroke="black" strokeWidth="1" opacity="0.6" fill="none" />
                            <circle cx="150" y="350" r="20" fill="none" stroke="black" strokeWidth="1" strokeDasharray="2,4" />
                            <circle cx="520" y="100" r="15" fill="none" stroke="black" strokeWidth="1" strokeDasharray="2,4" />
                            
                            {/* Subtle desk */}
                            <path d="M250,350 L500,350 L550,370 L200,370" fill="white" stroke="black" strokeWidth="1" opacity="0.8" />
                        </svg>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;