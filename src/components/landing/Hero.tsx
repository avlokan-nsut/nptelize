import React from "react";

import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";
import HeroIllustration from "./HeroIllustration";

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

const Hero: React.FC = () => {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const role = useAuthStore((state) => state.user?.role);

    const handleClick = () => {
        if (user) {
            // Redirect to dashboard based on user role
            if(role === 'teacher')navigate("/faculty/dashboard")
            else navigate(`/${role}/dashboard`);
        } else {
            // Redirect to login if not logged in
            navigate("/login");
        }
    };

    return (
        <section className="relative min-h-[90vh] w-full flex items-center overflow-hidden">
            <HeroBackground />

            <div className="container mx-auto px-6 py-16 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    <HeroContent
                        title="Simplify Your NPTEL Certificate Submission"
                        description="Avlokan streamlines the verification and submission process for your NPTEL certificates. Get your achievements recognized quickly and securely."
                        ctaText={user ? "Get Started" : "Log In"}
                        onCtaClick={handleClick}
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
