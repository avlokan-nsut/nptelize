import TrueFocus from "../ui/TrueFocus"
import {
    Layers,
    Lock,
    Plug,
    CheckCircle,
    Shield,
    GraduationCap,
} from "lucide-react";

const Features = () => {
    return (
        <section className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-18">
            <div className="flex flex-col bg-[#F0F8FF] px-4 py-12 md:px-6 md:py-12 rounded-2xl md:flex-row">
                {/* Left Side */}
                <div className="w-full md:w-1/2 flex flex-col justify-center items-center font-hero mb-8 md:mb-0">
                    <div className="flex flex-col space-y-4 md:space-y-6 max-w-sm md:max-w-none">
                        <div className="flex items-center">
                            <Layers className="w-5 h-5 text-blue-600 mr-3" />
                            <div>3 Layers of verification</div>
                        </div>

                        <div className="flex items-center">
                            <Lock className="w-5 h-5 text-blue-600 mr-3" />
                            <div>Fast and secure</div>
                        </div>

                        <div className="flex items-center">
                            <Plug className="w-5 h-5 text-blue-600 mr-3" />
                            <div>No middleware involved</div>
                        </div>

                        <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
                            <div>Validate authenticity instantly</div>
                        </div>

                        <div className="flex items-center">
                            <Shield className="w-5 h-5 text-blue-600 mr-3" />
                            <div>Zero data manipulation risk</div>
                        </div>

                        <div className="flex items-center">
                            <GraduationCap className="w-5 h-5 text-blue-600 mr-3" />
                            <div>University-grade verification protocols</div>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="w-full md:w-1/2 flex justify-center items-center font-hero">
                    <TrueFocus
                        sentence="Verify Authentically"
                        manualMode={false}
                        blurAmount={5}
                        borderColor="red"
                        animationDuration={2}
                        pauseBetweenAnimations={1}
                    />
                </div>
            </div>
        </section>
    )
}

export default Features