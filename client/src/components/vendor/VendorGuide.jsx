import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function VendorGuide() {
    const [activeSection, setActiveSection] = useState("");

    
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

    useEffect(() => {
        const handleScroll = () => {
        const sections = document.querySelectorAll('.section-help');
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
                <p className='margin-b-24'><strong className='text-blue'>Table of Contents</strong></p>
                <ul>
                {sections.map((section, index) => (
                    <li key={index} className={activeSection === section ? "active text-blue" : "text-blue"}>
                        <a href={`#${encodeURI(section)}`}>{section}</a>
                    </li>
                ))}
                </ul>
            </aside>
            <div className="help-content">

                <section id="Introduction" className="section-help">
                    <h3 className="margin-b-16">Introduction</h3>
                    <p className="margin-b-16">
                        Welcome to the Gingham Vendor Portal How-To Guide! This page is designed to provide you with a comprehensive overview
                        of how to navigate and utilize the Gingham Vendor Portal effectively. Whether you’re setting up your profile, managing
                        team members, creating events, or optimizing sales, this guide will walk you through every step.
                    </p>
                    <p className="margin-b-16">
                        Use the Table of Contents on the left to jump to specific topics, or scroll through the guide to explore all the features
                        and functionality available to vendors like you. Let’s get started and make your vendor experience seamless and successful!
                    </p>
                    <a href="../../public/help-center-assets/VENDOR PORTAL - HOW TO GUIDE.pdf" download className="download-link">
                        <span className="text-500">Download the Full How-To Guide (PDF)</span>
                    </a>
                </section>

                <section id="Setting-Up your Vendor-User Profile" className="section-help">
                    <h3 className="margin-b-16">Setting-Up your Vendor-User Profile</h3>
                    <ol>
                        <li> Go to the <span className="text-500">Home Page</span>, scroll to the footer, and click "Vendor Portal." </li>
                        <li> Once on the Vendor Portal page, click <span className="text-500">Login/Signup</span> and create your profile. </li>
                        <li> After signing up, log in to your newly created Vendor-User profile. </li>
                    </ol>
                    <p className="margin-b-16">This step is the foundation for accessing all Vendor Portal features, so make sure to set up your profile correctly.</p>
                </section>

                <section id="Editing your Vendor-User Profile" className="section-help">
                    <h3 className="margin-b-16">Editing your Vendor-User Profile</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Creating a New Vendor Profile" className="section-help">
                    <h3 className="margin-b-16">Creating a New Vendor Profile</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Editing your existing Vendor Profile" className="section-help">
                    <h3 className="margin-b-16">Editing your existing Vendor Profile</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Managing Members of your Vendor Team" className="section-help">
                    <h3 className="margin-b-16">Managing Members of your Vendor Team</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Adding and Editing your Market Locations" className="section-help">
                    <h3 className="margin-b-16">Adding and Editing your Market Locations</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Understanding the Vendor Dashboard" className="section-help">
                    <h3 className="margin-b-16">Understanding the Vendor Dashboard</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Building Future Baskets" className="section-help">
                    <h3 className="margin-b-16">Building Future Baskets</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Editing Future Baskets" className="section-help">
                    <h3 className="margin-b-16">Editing Future Baskets</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Editing Today’s Baskets" className="section-help">
                    <h3 className="margin-b-16">Editing Today’s Baskets</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Scanning and Validating Basket Pick-Up’s" className="section-help">
                    <h3 className="margin-b-16">Scanning and Validating Basket Pick-Up’s</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Creating and Modifying Events" className="section-help">
                    <h3 className="margin-b-16">Creating and Modifying Events</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Using the Vendor Sales dashboard" className="section-help">
                    <h3 className="margin-b-16">Using the Vendor Sales dashboard</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

                <section id="Creating and Managing Multi-Vendor Profiles" className="section-help">
                    <h3 className="margin-b-16">Creating and Managing Multi-Vendor Profiles</h3>
                    <ol>
                        <li></li>
                        <li></li>
                        <li></li>
                    </ol>
                    <p className="margin-b-16"></p>
                    <p className="margin-b-16"></p>
                </section>

            </div>
        </div>

    </div>
  );
}

export default VendorGuide;
