import { FaArrowRight } from "react-icons/fa"
import { Link } from "react-router-dom"


const Team = () => {
    return (
        <>
            <section className="w-full py-16 px-4 md:py-20 md:px-18 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl mb-10 md:mb-12 font-inter">
                        Meet the team behind AVLOKAN
                    </h2>
                    
                    <div className="flex justify-center items-center mt-8">
                        <Link to="/developers">
                            <button
                                className="bg-blue-200 hover:bg-blue-300
                                text-gray-900 font-semibold text-lg md:text-xl
                                py-4 px-10 md:px-16 rounded-full
                                flex items-center gap-3
                                transition-all duration-300 ease-in-out
                                hover:shadow-lg hover:scale-105"
                            >
                                Check Now <FaArrowRight className="text-base" />
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Team