import CountUp from "../ui/Countup"
import GradientText from "../ui/Gradient";

const Counter = () => {
    // Array of counter data
    const counters = [
        {
            from: 0,
            to: 7000,
            title: "Papers Saved",
            duration: 0.7,
            suffix : "",
            separator: ",",
        },
        {
            from: 0,
            to: 10000,
            title: "Man-Hours Saved",
            duration: 0.7,
            suffix: "",
            separator: ",",
        },
        {
            from: 0,
            to: 6,
            title: "Distance Saved (km)",
            duration: 1,
            suffix: "L",
            separator: ",",
        },
        {
            from: 0,
            to: 6,
            title: "Travel Fare Saved (₹)",
            duration: 1,
            suffix: "L",
            separator: ",",
        },
    ];


    return (
        <>
            <section className="w-full py-6 px-10 lg:px-24 md:py-20 ">
                <div className=" flex flex-col space-y-10 justify-between font-hero text-black  rounded-xl text-center text-[22px] font-medium md:flex-row md:space-y-0 ">
                    {counters.map((counter, index) => (
                        <div key={index}>
                            <GradientText
                                colors = {["#0f9960", "#1a4fd1", "#0f9960", "#1a4fd1", "#0f9960"]}
                                animationSpeed={3}
                                showBorder={false}
                                className="custom-class"
                            >
                                <CountUp
                                    from={counter.from}
                                    to={counter.to}
                                    separator={counter.separator}
                                    direction="up"
                                    duration={counter.duration}
                                    className="count-up-text"
                                />
                                <span className="mr-2">{counter.suffix}+</span>
                                <br />
                                {counter.title}
                            </GradientText>
                        </div>

                    ))}
                </div>
            </section>
        </>
    )
}

export default Counter