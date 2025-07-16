import { FaArrowRight } from "react-icons/fa"
import { Link } from "react-router-dom"


const Team = () => {
    return (
        <>
            <section className="w-full py-10  px-4 md:py-12  md:px-18">

                <div className='text-3xl text-center lg:text-4xl'>
                    <span className='font-bold italic bg-blue-200 px-1 mr-2'>Meet the team behind</span>
                    <span className='font-bold italic'>AVLOKAN</span>
                </div>
                <div className="w-full flex justify-center items-center text-white mt-12 ">

                    <Link to="/developers">
                        <button
                            className="bg-gradient-to-r from-white via-blue-200 to-blue-500
                   text-black py-2 px-6 md:px-12 rounded-2xl text-lg md:text-xl
                   flex items-center gap-2 font-semibold shadow-lg
                   hover:shadow-xl transition-shadow border border-black"
                        >
                            Check Now <FaArrowRight />
                        </button>
                    </Link>

                </div>
            </section>
        </>
    )
}

export default Team