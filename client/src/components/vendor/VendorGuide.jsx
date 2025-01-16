import React, { useState, useEffect } from 'react';
import '../../assets/css/index.css';

const sections = [
    "Introduction",
    "Setting-Up your Vendor-User Profile",
    "Editing your Vendor-User Profile",
    "Creating a new Vendor Profile",
    "Editing your existing Vendor Profile",
    "Managing Members of your Vendor Team",
    "Adding and Editing your Market Locations",
    "Understanding the Vendor Dashboard",
    "Building Future Baskets",
    "Editing Future Baskets",
    "Editing Today’s Baskets",
    "Scanning and Validating Basket Pick-Up’s",
    "Creating and Modifying Events",
    "Using the Vendor Sales dashboard",
    "Creating and Managing Multi-Vendor Profiles",
];

function VendorGuide() {
    const [activeSection, setActiveSection] = useState("");

    useEffect(() => {
        const handleScroll = () => {
        const sections = document.querySelectorAll('.section');
        let current = "";
        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 50) {
            current = section.getAttribute('id');
            }
        });
        setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
}, []);

return (
    <div className='box-bounding'>
        <h1 className="title-med margin-b-24">Vendor Portal How-To Guide</h1>
        <div className="vendor-guide">
            <aside className="toc">
            <p><strong>Table of Contents</strong></p>
            <br/>
            <ul>
            {sections.map((section, index) => (
                <li key={index} className={activeSection === section ? "active" : ""}>
                <a href={`#${section}`}>{section}</a>
                </li>
            ))}
            </ul>
        </aside>
        <main className="content">

            <section id="Introduction" className="section">
                <h2>Introduction</h2>
                <br/>
                <p>
                    Welcome to the Gingham Vendor Portal How-To Guide! This page is designed to provide you with a comprehensive overview 
                    of how to navigate and utilize the Gingham Vendor Portal effectively. Whether you’re setting up your profile, managing 
                    team members, creating events, or optimizing sales, this guide will walk you through every step.
                </p>
                <br/>
                <p>
                    Use the Table of Contents on the left to jump to specific topics, or scroll through the guide to explore all the features 
                    and functionality available to vendors like you. Let’s get started and make your vendor experience seamless and successful!
                </p>
                <br />
                <a href="../../public/help-center-assets/VENDOR PORTAL - HOW TO GUIDE.pdf" download className="download-link"> <strong>Download the Full How-To Guide (PDF)</strong> </a>
            </section>

            <section id="Setting-Up your Vendor-User Profile" className="section">
                <h2>Setting-Up your Vendor-User Profile</h2>
                <br/>
                <ol>
                    <li> Go to the <strong>Home Page</strong>, scroll to the footer, and click "Vendor Portal." </li>
                    <li> Once on the Vendor Portal page, click <strong>Login/Signup</strong> and create your profile. </li>
                    <li> After signing up, log in to your newly created Vendor-User profile. </li>
                </ol>
                <p> This step is the foundation for accessing all Vendor Portal features, so make sure to set up your profile correctly. </p>
            </section>

            <section id="Editing your Vendor-User Profile" className="section">
                <h2>Editing your Vendor-User Profile</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Creating a New Vendor Profile" className="section">
                <h2>Creating a New Vendor Profile</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Editing your existing Vendor Profile" className="section">
                <h2>Editing your existing Vendor Profile</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Managing Members of your Vendor Team" className="section">
                <h2>Managing Members of your Vendor Team</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Adding and Editing your Market Locations" className="section">
                <h2>Adding and Editing your Market Locations</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Understanding the Vendor Dashboard" className="section">
                <h2>Understanding the Vendor Dashboard</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Building Future Baskets" className="section">
                <h2>Building Future Baskets</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Editing Future Baskets" className="section">
                <h2>Editing Future Baskets</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Editing Today’s Baskets" className="section">
                <h2>Editing Today’s Baskets</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Scanning and Validating Basket Pick-Up’s" className="section">
                <h2>Scanning and Validating Basket Pick-Up’s</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Creating and Modifying Events" className="section">
                <h2>Creating and Modifying Events</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Using the Vendor Sales dashboard" className="section">
                <h2>Using the Vendor Sales dashboard</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

            <section id="Creating and Managing Multi-Vendor Profiles" className="section">
                <h2>Creating and Managing Multi-Vendor Profiles</h2>
                <br/>
                <ol>
                    <li></li>
                    <li></li>
                    <li></li>
                </ol>
                <p></p>
                <p></p>
            </section>

        </main>
        </div>

    </div>
  );
}

export default VendorGuide;
