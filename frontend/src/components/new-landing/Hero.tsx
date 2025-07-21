import { FaArrowRight } from "react-icons/fa"
import SplitText from "../ui/SplitText"
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const Hero = () => {
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
        <>
            <section className="p-6 mt-16 flex flex-col items-center justify-center font-hero md:mt-24 ">
                <div className='max-w-2xl flex flex-col items-center justify-center'>
                    <div className="text-center font-medium">
                        <h1 className="text-4xl md:text-5xl text-center leading-tight">
                            Effortless NPTEL submission and more,<br />
                           <SplitText
                                text="made possible!"
                                className="text-center"
                                charClassName="bg-gradient-to-r from-gray-900 to-slate-500 text-transparent bg-clip-text"
                                delay={100}
                                duration={0.6}
                                ease="power3.out"
                                splitType="chars"
                                from={{ opacity: 0, y: 40 }}
                                to={{ opacity: 1, y: 0 }}
                                threshold={0.1}
                                rootMargin="-100px"
                                textAlign="center"
                            />
                        </h1>

                    </div>

                    <div className="my-6 text-center">
                        AVLOKAN streamlines the verification and submission process for your NPTEL certificates and more. Get your achievements recognized quickly and securely
                    </div>

                    <div className="w-full max-w-md ">
                        {/* Log In form or button */}
                        <button className="w-full bg-black text-white py-2 rounded-xl flex flex-row justify-center items-center hover:cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-md shadow-gray-500" onClick={handleClick}>{user ?"Dashboard": "Log In"} <span className='ml-2'><FaArrowRight /></span></button>
                    </div>


                    <div className="pt-10 w-full flex justify-center lg:pt-20">
                        <div className="backdrop-blur-md bg-white/10 border-2 border-black rounded-xl p-1 max-w-4xl w-full">
                            <div className="aspect-[18/10] w-full relative">
                                <img 
                                    src="/landing/hero.avif" 
                                    loading="eager"
                                    fetchPriority="high"
                                    className="rounded-lg w-full h-full object-cover absolute inset-0"
                                    alt="Hero illustration"
                                />
                            </div>
                        </div>
                    </div>



                </div>

            </section>

        </>
    )
}

export default Hero