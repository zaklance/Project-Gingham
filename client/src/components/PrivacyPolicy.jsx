import React, {useState, useEffect} from 'react';

function PrivacyPolicy() {
    const [activeSection, setActiveSection] = useState("");

    const sections = [
        "About This Policy",
        "Information We Collect", 
        "How We Use Your Information", 
        "How We Share Your Information", 
        "Text Messaging Policy",
        "Data Security", 
        "Your Choices", 
        "Children's Privacy", 
        "International Users", 
        "Changes to This Privacy Policy", 
        "Contact Us"
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
        <div className="box-bounding">
            <h1 className="title-med margin-b-24">Privacy Policy</h1>
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
                <section id="About This Policy" className="section-help">
                    <h3 className="margin-b-16">About This Policy</h3>
                        <p className="margin-b-16">
                            <span className="text-500">Effective Date: March 1, 2025</span>
                        </p>
                        <p className="margin-b-16">
                            Gingham (“we,” “our,” or “us”) values your privacy and is committed to protecting your personal information. 
                            This Privacy Policy explains how we collect, use, share, and protect your data when you use our platform, 
                            including our website and mobile application (collectively, the “Platform”). By accessing or using Gingham, 
                            you agree to this Privacy Policy.
                        </p>
                </section>

                <section id="Information We Collect" className="section-help">
                    <h3 className="margin-b-16">Information We Collect</h3>
                        <p className="margin-b-16">
                            We collect the following types of information to provide and improve our service:
                        </p>
                        <ol>
                            <li>Personal information</li>
                                <ul className="ul-bullet">
                                    <li>Name, email address, phone number and other contact details</li>
                                    <li>Payment information, such as credit or debit card details (processed securely by third-party payment processors).</li>
                                </ul>
                            <li>Usage Data</li>
                                <ul className="ul-bullet">
                                    <li>Information about your interactions with the Platform (e.g. pages viewed, features used, and purchase history).</li>
                                    <li>Device information, including IP address, browser type, and operating system.</li>
                                </ul>
                            <li>Location Data</li>
                                <ul className="ul-bullet">
                                    <li>Approximate location data to match consumers with nearby markets and vendors (if enabled).</li>
                                </ul>
                            <li>Vendor-Specific Data</li>
                                <ul className="ul-bullet">
                                    <li>Vendor profiles, business details, and product listings.</li>
                                </ul>

                        </ol>
                </section>

                <section id="How We Use Your Information" className="section-help">
                    <h3 className="margin-b-16">How We Use Your Information</h3>
                        <p className="margin-b-16">
                            We use your data to: 
                        </p>
                        <ul className='ul-bullet'>
                            <li>Provide, maintain, and improve the Platform.</li>
                            <li>Facilitate transactions between consumers and vendors.</li>
                            <li>Send important updates, such as order confirmations or changes to services.</li>
                            <li>Personalize your experience, such as recommending relevant vendors or baskets.</li>
                            <li>Conduct analytics to enhance the Platform's performance and usability.</li>
                            <li>Comply with legal obligations or enforce our Terms of Service.</li>
                        </ul>
                </section>


                <section id="How We Share Your Information" className="section-help">
                    <h3 className="margin-b-16">How We Share Your Information</h3>
                        <p className="margin-b-16">
                            We do not sell your personal information. However, we may share your data under the following circumstances. 
                        </p>
                        <ul className="ul-bullet">
                            <li><strong>With Vendors:</strong> Limited information (e.g. your order details) is shared with vendors to fulfill purchases.</li>
                            <li><strong>With Service Providers:</strong> Third-party providers who assist with payment processing, analytics and customer support.</li>
                            <li><strong>Legal Obligations:</strong> If required by law, we may share information to comply with legal process to protect our rights.</li>
                            <li><strong>Business Transactions:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business.</li>
                        </ul>
                </section>

                <section id="Text Messaging Policy" className="section-help">
                    <h3 className="margin-b-16">Text Messaging Policy</h3>
                        <p className="margin-b-16">
                            By providing your phone number and opting into SMS notifications, you consent to receive text messages from Gingham regarding order updates, promotions, and account-related notifications. 
                        </p>
                        <p className="margin-b-16">
                            <strong>Opt-Out:</strong> You can opt out of receiving text messages at any time by replying "STOP" to any SMS message. Standard messaging rates may apply.
                        </p>
                </section>

                <section id="Data Security" className="section-help">
                    <h3 className="margin-b-16">Data Security</h3>
                        <p className="margin-b-16">
                            We take reasonable measures to protect your information from unauthorized access, loss, or misuse. However, no security system is completely
                            foolproof, and we cannot guarantee absolute security.
                        </p>
                </section>

                <section id="Your Choices" className="section-help">
                    <h3 className="margin-b-16">Your Choices</h3>
                        <ul className="ul-bullet">
                            <li><strong>Access and Update:</strong> You can review and update your personal information in your account settings.</li>
                            <li><strong>Marketing Preferences:</strong> Opt out of promotional emails by using the unsubscribe link in our communications</li>
                            <li><strong>Location Services:</strong> Disable location tracking in  your device settings if you prefer not to share location data.</li>
                            
                        </ul>
                </section>

                <section id="Children's Privacy" className="section-help">
                    <h3 className="margin-b-16">Children's Privacy</h3>
                        <p className="margin-b-16">
                            Our Platform is not intended for individuals under the age of 13. We do not knowingly collect personal information from children.
                        </p>
                </section>

                <section id="International Users" className="section-help">
                    <h3 className="margin-b-16">International Users</h3>
                        <p className="margin-b-16">
                            If you access the Platform outside of the United States, your information may be transferred to and processed in the United States, where data protection laws may differ.
                        </p>
                </section>

                <section id="Changes to This Privacy Policy" className="section-help">
                    <h3 className="margin-b-16">Changes to This Privacy Policy</h3>
                        <p className="margin-b-16">
                            We may update this Privacy Policy from time to time. Any significant changes will be communicated via email or through a notification on the platform.
                            Please review this page periodically for updates.
                        </p>
                </section>

                <section id="Contact Us" className="section-help">
                    <h3 className="margin-b-16">Contact Information</h3>
                        <p className="margin-b-16">
                            If you have any questions or concerns about this Privacy Policy, please contact us at: <span className="text-500">
                            <a href={`mailto:hello@gingham.nyc`} target="_blank" rel="noopener noreferrer"> hello@gingham.nyc</a></span>
                        </p>
                </section>


            </div>


            </div>
        </div>
    );
}

export default PrivacyPolicy;