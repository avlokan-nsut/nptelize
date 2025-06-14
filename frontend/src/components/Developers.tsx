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
            "/Team/Ankur-sir.jpg",
    },
    {
        id: 2,
        name: "Md Imran Hussain",
        role: "Product Manager",
        category: "product_manager",
        linkedinUrl: "https://www.linkedin.com/in/md-imran-hussain-8139a48b/",
        imageUrl:
            "/Team/imran-sir.jpg"
    },
    {
        id: 11,
        name: "Aditya Chouksey",
        role: "Product Manager",
        category: "product_manager",
        linkedinUrl: "https://www.linkedin.com/in/aditya-chouksey-0b6b70239/",
        imageUrl:
            "/Team/Aditya-sir.jpg"
    },
    {
        id: 3,
        name: "Ocean Lakra",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/ocean-lakra-6014b0253/",
        imageUrl:
            "/Team/Ocean.jpg",
    },
    {
        id: 4,
        name: "Madhav Arora",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/madhavarora03/",
        imageUrl:
            "/Team/madhav.jpg",
    },
    {
        id: 5,
        name: "Lakshay Gupta",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/lakshay-gupta-529a1428a/",
        imageUrl:
            "/Team/lakshay.jpg",
    },
    {
        id: 6,
        name: "Shrey Singh",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/shrey-singh7/",
        imageUrl:
            "/Team/shrey.jpg",
    },
    // {
    //     id: 7,
    //     name: "Shivam Mishra",
    //     role: "Developer",
    //     category: "developer",
    //     linkedinUrl: "https://www.linkedin.com/in/shivam-mishra-67671a17a/",
    //     imageUrl:
    //         "https://media.licdn.com/dms/image/v2/D5603AQGW76_XnWs0Cw/profile-displayphoto-shrink_400_400/B56Zc6ouyeHoAs-/0/1749035446441?e=1754524800&v=beta&t=4r8XV_NENI2E_FTr6tCQx6vN7PpUoUmIqeKlQm7rb0M",
    // },
    // {
    //     id: 8,
    //     name: "Dheeraj Kumar",
    //     role: "Developer",
    //     category: "developer",
    //     linkedinUrl: "https://www.linkedin.com/in/greatnerve",
    //     imageUrl:
    //         "https://media.licdn.com/dms/image/v2/D4D03AQG9m4Sk5fNgUg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1701061814364?e=1753315200&v=beta&t=0jPdk2c9JCNLuu1KU9rDBhOkoY5iY4KjmLZMMCefjn0",
    // },
    {
        id: 9,
        name: "Sujal Chaudhary",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/sujal-info/",
        imageUrl:
            "/Team/sujal.jpg",
    },
    {
        id: 10,
        name: "Pradeep Yadav",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/me-pradeep-yadav/",
        imageUrl:
            "/Team/pradeep.jpg",
    },
];

const Developers: React.FC = () => {
    const professorTeam = developers.filter(
        (dev) => dev.category === "professor"
    );
    const productManagers = developers.filter(
        (dev) => dev.category === "product_manager"
    );
    const devTeam = developers.filter((dev) => dev.category === "developer");

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
                            <TeamMemberCard
                                key={developer.id}
                                developer={developer}
                            />
                        ))}
                        {productManagers.map((developer) => (
                            <TeamMemberCard
                                key={developer.id}
                                developer={developer}
                            />
                        ))}
                    </div>
                </div>
            )}

            {devTeam.length > 0 && (
                <div className="team-section">
                    <h2 className="section-title">Developers</h2>
                    <div className="developers-grid">
                        {devTeam.map((developer) => (
                            <TeamMemberCard
                                key={developer.id}
                                developer={developer}
                            />
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
        <div
            className={`developer-card ${
                developer.category === "professor" ? "professor-card" : ""
            }`}
        >
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
                <span className={`developer-role ${developer.category}`}>
                    {developer.role}
                </span>

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
