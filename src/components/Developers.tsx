import React from "react";
import { FaLinkedin } from "react-icons/fa";
import "./Developers.css"; // We'll create this file next

interface Developer {
    id: number;
    name: string;
    linkedinUrl: string;
    imageUrl: string;
}

const developers: Developer[] = [
    {
        id: 1,
        name: "Ocean Lakra",
        linkedinUrl: "https://www.linkedin.com/in/ocean-lakra-6014b0253/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQFHZdrTrtmZNw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1721204459159?e=1753315200&v=beta&t=maCyoqhIu0bKhIl_P9Yy7h1sBfPO5eB58zluzURAM-I",
    },

    {
        id: 2,
        name: "Madhav Arora",
        linkedinUrl: "https://www.linkedin.com/in/madhavarora03/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQGBQaOQjuS9oA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1666372458588?e=1753315200&v=beta&t=3mfw5lw9W5bUIlkqLz2VbU0E2HAa489RMx4vYrQ2_gs",
    },

    {
        id: 3,
        name: "Lakshay Gupta",
        linkedinUrl: "https://www.linkedin.com/in/lakshay-gupta-529a1428a/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQFMh9epBhZfCw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1715603777484?e=1753315200&v=beta&t=BKXURGfWccxukCB6plESdN-9w4ARFOugobioihKdPBM",
    },

    {
        id: 4,
        name: "Shrey Singh",
        linkedinUrl: "https://www.linkedin.com/in/shrey-singh7/",

        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQE82U1GS8P5Lg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1723665573161?e=1753315200&v=beta&t=aGD7kL5A_17P5a3SMgO5lZZ4wdbeRaoqO8AVIHazFv8",
    },

    {
        id: 5,
        name: "Shivam Mishra",
        linkedinUrl: "https://www.linkedin.com/in/shivam-mishra-67671a17a/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D4D03AQEg9GdcmqBDRA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1689218201934?e=1753315200&v=beta&t=zWBcuclP85rKKW31xeexRYpT1FVep8PhFD--qmWTc28",
    },

    {
        id: 6,
        name: "Dheeraj Kumar",
        linkedinUrl: "https://www.linkedin.com/in/greatnerve",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D4D03AQG9m4Sk5fNgUg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1701061814364?e=1753315200&v=beta&t=0jPdk2c9JCNLuu1KU9rDBhOkoY5iY4KjmLZMMCefjn0",
    },

    {
        id: 7,
        name: "Sujal Chaudhary",
        linkedinUrl: "https://www.linkedin.com/in/sujal-info/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D5603AQE90HSvqYkvJg/profile-displayphoto-shrink_400_400/B56ZQz3riQHQAk-/0/1736037022825?e=1753315200&v=beta&t=U8h7HnphgNZH1ceztfer94cagbbR1RAMGdanqt5xSwg",
    },
    {
        id: 8,
        name: "Pradeep Yadav",
        linkedinUrl: "https://www.linkedin.com/in/me-pradeep-yadav/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D4E03AQHk1jG7H1sL4w/profile-displayphoto-shrink_400_400/B4EZPT4sLdHsAg-/0/1734426674787?e=1753315200&v=beta&t=yQjSDy73F3sL8vao0yQuFC0t4dnaibPBEy4H-NaJhFg",
    },

    {
        id: 9,
        name: "Aditya Chouksey",
        linkedinUrl: "https://www.linkedin.com/in/aditya-chouksey-0b6b70239/",
        imageUrl:
            "https://media.licdn.com/dms/image/v2/D4D03AQFocdd0jx8trw/profile-displayphoto-shrink_100_100/B4DZb2sTxEGwAU-/0/1747895533426?e=1753315200&v=beta&t=ZXCsTVqe9A7wHjmUJHEsWSYCFet9PRk9r1VaXA6NJ5c",
    },
];

const Developers: React.FC = () => {
    return (
        <div className="developers-container">
            <h1 className="developers-title">Meet Our Team</h1>
            <p className="developers-subtitle">
                The creative minds and brilliant engineers behind Avlokan.
            </p>

            <div className="developers-grid">
                {developers.map((developer) => (
                    <div key={developer.id} className="developer-card">
                        <div className="developer-info">
                            <h2 className="developer-name">{developer.name}</h2>
                            <a
                                href={developer.linkedinUrl}
                                className="linkedin-link"
                                aria-label={`${developer.name}'s LinkedIn profile`}
                            >
                                <FaLinkedin className="linkedin-icon" />
                            </a>
                        </div>
                        <div className="developer-image-container">
                            <img
                                src={developer.imageUrl}
                                alt={`${developer.name}`}
                                className="developer-image"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Developers;
