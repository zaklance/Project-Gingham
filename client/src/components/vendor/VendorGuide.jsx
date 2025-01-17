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

    console.log(encodeURI(sections))

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
                        <li>Log in to your account and navigate to the <span className="text-500">Profile tab</span>.</li>
                        <li>Click the <span className="text-500">Edit button</span> to enter Edit Mode.</li>
                        <li>Make the necessary changes and click <span className="text-500">Save Changes</span> or <span className="text-500">Cancel</span> to discard them.</li>
                    </ol>
                </section>

                <section id="Creating a new Vendor Profile" className="section-help">
                    <h3 className="margin-b-16">Creating a New Vendor Profile</h3>
                    <ol>
                        <li>After creating a new Profile, navigate to the <span className="text-500">Dashboard</span> or <span className="text-500">Profile tab</span>.</li>
                        <li>Fill out the required fields in the Vendor Profile form.</li>
                        <li>Click <span className="text-500">Create Vendor</span> to complete the process.</li>
                    </ol>
                    <p className="margin-b-16">If the product you sell isn't listed, choose "Other" and specify it. It will update once approved.</p>
                </section>

                <section id="Editing your existing Vendor Profile" className="section-help">
                    <h3 className="margin-b-16">Editing your Existing Vendor Profile</h3>
                    <ol>
                        <li>Navigate to the <span className="text-500">Profile tab</span>.</li>
                        <li>Click <span className="text-500">Edit</span> to modify your Vendor Profile information.</li>
                        <li>After making the changes, click <span className="text-500">Save Changes</span> or <span className="text-500">Cancel</span> to discard.</li>
                    </ol>
                </section>

                <section id="Managing Members of your Vendor Team" className="section-help">
                    <h3 className="margin-b-16">Managing Members of your Vendor Team</h3>
                    <ol>
                        <li>Team members can create a Vendor-User profile and request to join an existing team.</li>
                        <li>If you are the admin, you’ll receive notifications to approve or reject requests.</li>
                        <li>You can also invite members by email or manage roles in the Vendor Dashboard under the Team tab.</li>
                    </ol>
                </section>

                <section id="Adding and Editing your Market Locations" className="section-help">
                    <h3 className="margin-b-16">Adding and Editing your Market Locations</h3>
                    <ol>
                        <li>Navigate to the Vendor Information section and search for the desired Market location.</li>
                        <li>Select the day(s) for participation and click <span className="text-500">Add Day</span>.</li>
                        <li>To remove a Market, find it under <span className="text-500">Delete Markets</span> and click <span className="text-500">Delete</span>.</li>
                    </ol>
                    <p className="margin-b-16">For new Farmers Markets, email hello@gingham.nyc with your request.</p>
                </section>

                <section id="Understanding the Vendor Dashboard" className="section-help">
                    <h3 className="margin-b-16">Understanding the Vendor Dashboard</h3>
                    <p className="margin-b-16">The Vendor Dashboard consists of three main tabs: Baskets, Events, and Team.</p>
                    <ul>
                        <li><span className="text-500">Admins</span> can manage all tabs, including Baskets, Events, and Team settings.</li>
                        <li><span className="text-500">Employees</span> can access and manage Baskets.</li>
                    </ul>
                </section>

                <section id="Building Future Baskets" className="section-help">
                    <h3 className="margin-b-16">Building Future Baskets</h3>
                    <ol>
                        <li>Enter the quantity of Baskets for sale, their value, and price.</li>
                        <li>Specify pick-up start and end times.</li>
                        <li>Click <span className="text-500">Save</span> to confirm your entries. Baskets will go live 48 hours before pick-up.</li>
                    </ol>
                    <p className="margin-b-16">Note: Sold Baskets cannot be deleted. Update other fields as needed.</p>
                </section>

                <section id="Editing Future Baskets" className="section-help">
                    <h3 className="margin-b-16">Editing Future Baskets</h3>
                    <ol>
                        <li>Click <span className="text-500">Edit</span> to adjust quantities or details of unsold Baskets.</li>
                        <li>To delete, click <span className="text-500">Delete Unsold</span>, ensuring no sales have occurred.</li>
                    </ol>
                </section>

                <section id="Editing Today’s Baskets" className="section-help">
                    <h3 className="margin-b-16">Editing Today’s Baskets</h3>
                    <ol>
                        <li>Click <span className="text-500">Edit</span> to adjust Basket quantities as needed, ensuring no decrease below sold amounts.</li>
                        <li>Click <span className="text-500">Save</span> to confirm changes.</li>
                    </ol>
                </section>

                <section id="Scanning and Validating Basket Pick-Up’s" className="section-help">
                    <h3 className="margin-b-16">Scanning and Validating Basket Pick-Up’s</h3>
                    <ol>
                        <li>Click the <span className="text-500">Scan</span> tab in the navigation bar.</li>
                        <li>Use your device to scan the customer’s QR Code.</li>
                        <li>Ensure the scanned code matches the listed Basket details.</li>
                    </ol>
                </section>

                <section id="Creating and Modifying Events" className="section-help">
                    <h3 className="margin-b-16">Creating and Modifying Events</h3>
                    <ol>
                        <li>Navigate to the <span className="text-500">Events</span> tab in the Vendor Dashboard.</li>
                        <li>Create an event for the appropriate Market and save changes.</li>
                        <li>Edit or cancel events as needed before their end dates.</li>
                    </ol>
                </section>

                <section id="Using the Vendor Sales dashboard" className="section-help">
                    <h3 className="margin-b-16">Using the Vendor Sales Dashboard</h3>
                    <ol>
                        <li>Access the <span className="text-500">Sales</span> tab in the navigation bar.</li>
                        <li>Review sales data using filters for timeframes and Markets.</li>
                        <li>Analyze sales trends to optimize your strategy.</li>
                    </ol>
                </section>

                <section id="Creating and Managing Multi-Vendor Profiles" className="section-help">
                    <h3 className="margin-b-16">Creating and Managing Multi-Vendor Profiles</h3>
                    <ol>
                        <li>Add or join additional Vendor Teams as an Admin or Employee.</li>
                        <li>Switch between Active Vendor profiles using the dropdown menu.</li>
                        <li>Ensure the correct Active Vendor is selected for each task.</li>
                    </ol>
                </section>

            </div>
        </div>

    </div>
  );
}

export default VendorGuide;
