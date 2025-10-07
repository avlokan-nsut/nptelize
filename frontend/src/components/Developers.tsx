import React from "react";
import { FaLinkedin, FaLink } from "react-icons/fa";
import "./Developers.css";

interface Developer {
    id: number;
    name: string;
    role: string;
    category: "professor" | "product_manager" | "developer";
    linkedinUrl?: string;
    websiteUrl?: string;
    imageUrl: string;
}

const developers: Developer[] = [
    {
        id: 101,
        name: "Prof. Smriti Srivastava",
        role: "Dean Academic",
        category: "professor",
        websiteUrl: "https://www.nsut.ac.in/en/node/548",
        imageUrl: "/Team/Smriti-mam.png",
    },
    {
        id: 102,
        name: "Dr. Ankur Gupta",
        role: "Convenor, AoAA",
        category: "professor",
        linkedinUrl: "https://www.linkedin.com/in/ankursynon/",
        imageUrl: "/Team/Ankur-sir.jpg",
    },
    {
        id: 103,
        name: "Prof. Anand Gupta",
        role: "CSE",
        category: "professor",
        websiteUrl: "https://www.nsut.ac.in/en/node/253",
        imageUrl: "/Team/Anand-sir.png",
    },
    {
        id: 104,
        name: "Prof. Arti M.K.",
        role: "ECE (East Campus)",
        category: "professor",
        websiteUrl: "https://www.nsut.ac.in/en/node/852",
        imageUrl: "/Team/Arti-mam.png",
    },
    {
        id: 105,
        name: "Dr. Tarun Rawat",
        role: "ECE",
        category: "professor",
        websiteUrl: "https://www.nsut.ac.in/en/node/271",
        imageUrl: "/Team/Tarun-sir.png",
    },
    {
        id: 106,
        name: "Dr. Sumita Dahiya",
        role: "Mathematics",
        category: "professor",
        websiteUrl: "https://www.nsut.ac.in/en/node/1507",
        imageUrl: "/Team/Sumita-mam.png",
    },
    {
        id: 107,
        name: "Dr. Anjanee Kumar Mishra",
        role: "West Campus",
        category: "professor",
        websiteUrl: "https://www.nsut.ac.in/en/node/1427",
        imageUrl: "/Team/Anjanee-sir.png",
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
    {
        id: 7,
        name: "Shivam Mishra",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/shivam-mishra-67671a17a/",
        imageUrl:
            "/Team/Shivam.png",
    },
    {
        id: 8,
        name: "Dheeraj Kumar",
        role: "Developer",
        category: "developer",
        linkedinUrl: "https://www.linkedin.com/in/greatnerve",
        imageUrl:
            "/Team/Dheeraj.jpg",
    },
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
            <div className="team-sections-wrapper">
                {professorTeam.length > 0 && (
                    <div className="team-section">
                        <h2 className="section-title">Core Committee</h2>
                        <div className="leadership-grid">
                            {professorTeam.map((developer) => (
                                <TeamMemberCard
                                    key={developer.id}
                                    developer={developer}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {(devTeam.length > 0 || productManagers.length > 0) && (
                    <div className="team-section">
                        <h2 className="section-title">Management and Development Team</h2>
                        <div className="developers-grid">
                            {productManagers.map((developer) => (
                                <TeamMemberCard
                                    key={developer.id}
                                    developer={developer}
                                />
                            ))}
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
                    {developer.linkedinUrl && (
                        <a
                            href={developer.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-link"
                            aria-label={`${developer.name}'s LinkedIn profile`}
                        >
                            <FaLinkedin />
                        </a>
                    )}
                    {developer.websiteUrl && (
                        <a
                            href={developer.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-link website-link"
                            aria-label={`${developer.name}'s website`}
                        >
                            <FaLink />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Developers;
