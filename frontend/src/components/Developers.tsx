import React from "react";
import { FaLinkedin } from "react-icons/fa";
import "./Developers.css";

interface Developer {
    id: number;
    name: string;
    role: string;
    category: "professor" | "product_manager" | "developer";
    linkedinUrl: string;
    imageUrl: string;
}

const developers: Developer[] = [
    {
        id: 1,
        name: "Ankur Gupta",
        role: "Convenor AoAA, NSUT",
        category: "professor",
        linkedinUrl: "https://www.linkedin.com/in/ankursynon/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQGTVaLHVAl1Gw/profile-displayphoto-shrink_400_400/B56ZVVlktHHEAg-/0/1740897669114?e=1753920000&v=beta&t=ovk1hny48YhHBibZ-oTQRA6aijVaRtPaOGA556RO8cA",
    },
    {
        id: 2,
        name: "Md Imran Hussain",
        role: "Product Manager",
        category: "product_manager",
        linkedinUrl: "https://www.linkedin.com/in/md-imran-hussain-8139a48b/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/C4D03AQHja-1Kn514ZA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1585737988234?e=1753920000&v=beta&t=E9tDkBUqH2-U5Z4-hcK6S4Fc2FPkSZKyq3excCfPp1E",
    },
    {
        id: 11,
        name: "Aditya Chouksey",
        role: "Product Manager",
        category: "product_manager",
        linkedinUrl: "https://www.linkedin.com/in/aditya-chouksey-0b6b70239/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D4D03AQFocdd0jx8trw/profile-displayphoto-shrink_100_100/B4DZb2sTxEGwAU-/0/1747895533426?e=1753315200&v=beta&t=ZXCsTVqe9A7wHjmUJHEsWSYCFet9PRk9r1VaXA6NJ5c",
    },    {
        id: 3,
        name: "Ocean Lakra",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/ocean-lakra-6014b0253/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQFHZdrTrtmZNw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1721204459159?e=1753315200&v=beta&t=maCyoqhIu0bKhIl_P9Yy7h1sBfPO5eB58zluzURAM-I",
    },
    {
        id: 4,
        name: "Madhav Arora",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/madhavarora03/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQGBQaOQjuS9oA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1666372458588?e=1753315200&v=beta&t=3mfw5lw9W5bUIlkqLz2VbU0E2HAa489RMx4vYrQ2_gs",
    },    {
        id: 5,
        name: "Lakshay Gupta",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/lakshay-gupta-529a1428a/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQFMh9epBhZfCw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1715603777484?e=1753315200&v=beta&t=BKXURGfWccxukCB6plESdN-9w4ARFOugobioihKdPBM",
    },
    {
        id: 6,
        name: "Shrey Singh",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/shrey-singh7/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQE82U1GS8P5Lg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1723665573161?e=1753315200&v=beta&t=aGD7kL5A_17P5a3SMgO5lZZ4wdbeRaoqO8AVIHazFv8",
    },    {
        id: 7,
        name: "Shivam Mishra",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/shivam-mishra-67671a17a/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D4D03AQEg9GdcmqBDRA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1689218201934?e=1753315200&v=beta&t=zWBcuclP85rKKW31xeexRYpT1FVep8PhFD--qmWTc28",
    },
    {
        id: 8,
        name: "Dheeraj Kumar",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/greatnerve",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D4D03AQG9m4Sk5fNgUg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1701061814364?e=1753315200&v=beta&t=0jPdk2c9JCNLuu1KU9rDBhOkoY5iY4KjmLZMMCefjn0",
    },    {
        id: 9,
        name: "Sujal Chaudhary",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/sujal-info/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQE90HSvqYkvJg/profile-displayphoto-shrink_400_400/B56ZQz3riQHQAk-/0/1736037022825?e=1753315200&v=beta&t=U8h7HnphgNZH1ceztfer94cagbbR1RAMGdanqt5xSwg",
    },
    {
        id: 10,
        name: "Pradeep Yadav",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/me-pradeep-yadav/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D4E03AQHk1jG7H1sL4w/profile-displayphoto-shrink_400_400/B4EZPT4sLdHsAg-/0/1734426674787?e=1753315200&v=beta&t=yQjSDy73F3sL8vao0yQuFC0t4dnaibPBEy4H-NaJhFg",
    },
];

const Developers: React.FC = () => {
    const professorTeam = developers.filter(dev => dev.category === "professor");
    const productManagers = developers.filter(dev => dev.category === "product_manager");
    const devTeam = developers.filter(dev => dev.category === "developer");

    return (
        <div className="developers-container">
            <div>
                <h1 className="developers-title">Meet Our Team</h1>
                <p className="developers-subtitle">
                    The people who bring AVLOKAN to life.
                </p>
            </div>
            {(professorTeam.length > 0 || productManagers.length > 0) && (
                <div className="team-section">
                    <h2 className="section-title">Leadership Team</h2>
                    <div className="developers-grid leadership-grid">
                        {professorTeam.map((developer) => (
                            <TeamMemberCard key={developer.id} developer={developer} />
                        ))}
                        {productManagers.map((developer) => (
                            <TeamMemberCard key={developer.id} developer={developer} />
                        ))}
                    </div>
                </div>
            )}

            {devTeam.length > 0 && (
                <div className="team-section">
                    <h2 className="section-title">Developers</h2>
                    <div className="developers-grid">
                        {devTeam.map((developer) => (
                            <TeamMemberCard key={developer.id} developer={developer} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface TeamMemberCardProps {
    developer: Developer;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ developer }) => {
    return (
        <div className={`developer-card ${developer.category === "professor" ? "professor-card" : ""}`}>
            <div className="developer-image-container">
                <img
                    src={developer.imageUrl}
                    alt={`${developer.name}`}
                    className="developer-image"
                    loading="lazy"
                />
            </div>
            
            <div className="developer-info">
                <h3 className="developer-name">{developer.name}</h3>
                <span className={`developer-role ${developer.category}`}>{developer.role}</span>
                
                <div className="social-links">
                    <a
                        href={developer.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="social-link"
                        aria-label={`${developer.name}'s LinkedIn profile`}
                    >
                        <FaLinkedin />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Developers;
