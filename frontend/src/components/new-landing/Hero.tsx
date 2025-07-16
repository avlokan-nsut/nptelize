import { FaArrowRight } from "react-icons/fa"
import SplitText from "../ui/SplitText"

const Hero = () => {
    return (
        <>
            <section className="p-6 pt-24 flex flex-col items-center justify-center font-hero md:h-[90vh] lg:min-h-screen">
                <div className='max-w-2xl flex flex-col items-center justify-center'>
                    <div className="text-center font-medium">
                        <h1 className="text-4xl md:text-5xl text-center leading-tight">
                            Effortless NPTEL submission,<br />
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
                        AVLOKAN streamlines the verification and submission process for your NPTEL certificates. Get your achievements recognized quickly and securely
                    </div>

                    <div className="w-full max-w-md ">
                        {/* Log In form or button */}
                        <button className="w-full bg-black text-white py-2 rounded-xl flex flex-row justify-center items-center">Log In <span className='ml-2'><FaArrowRight /></span></button>
                    </div>


                    <div className="pt-10 w-full flex justify-center lg:pt-20">
                        <div className="backdrop-blur-md bg-white/10 border-2 border-black rounded-xl p-1">
                            <img src="/landing/hero.png" className="rounded-lg" />
                        </div>
                    </div>



                </div>

            </section>

        </>
    )
}

export default Hero