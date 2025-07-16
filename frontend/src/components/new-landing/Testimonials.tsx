import { Quote } from 'lucide-react';
import testimonials from './testimonials.json';


function Testimonials() {

    const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
        <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 md:p-8 min-w-[280px] sm:min-w-[340px] md:min-w-[400px] mx-2 sm:mx-4 shadow-sm font-hero">
            <Quote className="text-blue-400 w-4 h-4 mb-4 sm:mb-6" />
            <p className="text-gray-700 text-base sm:text-md leading-relaxed mb-6 sm:mb-8 ">
                {testimonial.quote}
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
                {/* <img 
          src={testimonial.avatar} 
          alt={testimonial.name}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
        /> */}
                <div>
                    <h4 className="text-gray-900 font-semibold text-base sm:text-lg">{testimonial.name}</h4>
                    <p className="text-gray-500 text-xs sm:text-sm">{testimonial.title}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white py-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl font-hero font-semibold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
                        Words of praise from others<br />

                    </h2>
                </div>

                {/* Testimonials with scrolling animation */}
                <div className="space-y-8 overflow-hidden">
                    {/* First row - Left to Right */}
                    <div className="flex animate-scroll-left">
                        {[...testimonials, ...testimonials].map((testimonial, index) => (
                            <TestimonialCard key={`left-${index}`} testimonial={testimonial} />
                        ))}
                    </div>

                    {/* Second row - Right to Left */}
                    <div className="flex animate-scroll-right">
                        {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((testimonial, index) => (
                            <TestimonialCard key={`right-${index}`} testimonial={testimonial} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Testimonials;