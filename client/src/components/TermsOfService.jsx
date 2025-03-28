import React, {useState, useEffect} from 'react'

function TermsOfService() {
    const [activeSection, setActiveSection] = useState("");

    const sections = [
        "Introduction", 
        "Eligibility and Account Registration",
        "Use of Platform",
        "Purchases and Payment Terms",
        "Return and Exchange Policy",
        "Vendor Terms",
        "Consumer Terms",
        "Text Messaging Policy",
        "Limitation of Liability",
        "Intellectual Property",
        "Termination of Accounts",
        "Changes to Terms of Service",
        "Dispute Resolution",
        "Contact Information"
    ];

    const generateId = (section) => 
        section.toLowerCase().replace(/\s+/g, "-");

    useEffect(() => {
        const handleScroll = () => {
            const sectionElements = document.querySelectorAll('.section-help');
            let current = "";
            sectionElements.forEach((section) => {
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
            <h1 className="title-med margin-b-24">Terms of Service</h1>
            <div className='vendor-guide'>
                <aside className="toc">
                    <p className='margin-b-24'><strong className='text-blue'>Table of Contents</strong></p>
                    <ul>
                    {sections.map((section, index) => {
                        const sectionId = generateId(section); // Generate the ID
                        return (
                            <li key={index} className={activeSection === sectionId ? "active text-blue" : "text-blue"}>
                                <a href={`#${sectionId}`}>{section}</a>
                            </li>
                        );
                    })}
                    </ul>
                </aside>
                <div className="help-content">
                    <section id="introduction" className="section-help">
                        <h3 className="margin-b-16">Introduction</h3>
                            <p className="margin-b-16">
                                <span className="text-500">Effective Date: March 1, 2025</span>
                            </p>
                            <p className="margin-b-16">
                                Lorem Ipsum Salt                            
                            </p>
                    </section>
                    <section id="eligibility-and-account-registration" className="section-help">
                        <h3 className="margin-b-16">Eligibility and Account Registration</h3>
                            <p className="margin-b-16">
                                Lorem Impsum Salt 
                            </p>
                    </section>
                    <section id="use-of-platform" className="section-help">
                        <h3 className="margin-b-16">Use of Platform</h3>
                            <p className="margin-b-16">
                                Lorem Impsum Salt 
                            </p>
                    </section>
                    <section id="purchases-and-payment-terms" className="section-help">
                        <h3 className="margin-b-16">Purchases and Payment Terms</h3>
                            <p className="margin-b-16">
                                Lorem Impsum Salt 
                            </p>
                    </section>
                    <section id="return-and-exchange-policy" className="section-help">
                        <h3 className="margin-b-16">Return and Exchange Policy</h3>
                            <p className="margin-b-16">
                                At Gingham, all sales are final, and we do not accept returns, refunds, or exchanges for any purchases.
                            </p>
                            <p className="margin-b-16">
                                <strong>Exceptions:</strong> Refunds or adjustments may be made only if the Vendor or Farmers Market changes 
                                operating hours or cancels due to unforeseen circumstances such as inclement weather.
                            </p>
                            <p className="margin-b-16">
                                If you believe your situation qualifies for an exception, <strong>please contact our support team at 
                                <a href={`mailto:hello@gingham.nyc`} target="_blank" rel="noopener noreferrer"> sales@gingham.nyc</a>.</strong>
                            </p>
                            <p className="margin-b-16">
                                Please note that any refunds may or may not include transaction fees based on the reason for refund. 
                            </p>
                            <p className="margin-b-16">
                                Thank you for your understanding and support of local farmers and vendors.
                            </p>
                    </section>
                    <section id="vendor-terms" className="section-help">
                        <h3 className="margin-b-16">Vendor Terms</h3>
                            <p className="margin-b-16">
                                Lorem Impsum Salt 
                            </p>
                    </section>
                    <section id="consumer-terms" className="section-help">
                        <h3 className="margin-b-16">Consumer Terms</h3>
                            <p className="margin-b-16">
                                Lorem Impsum Salt 
                            </p>
                    </section>
                    <section id="text-messaging-policy" className="section-help">
                        <h3 className="margin-b-16">Text Messaging Policy</h3>
                            <p className="margin-b-16">
                                By using our services, you agree to receive text messages from Gingham related to your orders, account status, and promotions. Message frequency may vary.
                            </p>
                            <p className="margin-b-16">
                                <strong>Opt-Out:</strong> You may opt out of SMS notifications at any time by replying "STOP" to any message. Standard carrier messaging rates apply.
                            </p>
                    </section>
                    <section id="limitation-of-liability" className="section-help">
                        <h3 className="margin-b-16">Limitation of Liability</h3>
                            <p className="margin-b-16">
                                Lorem Impsum Salt 
                            </p>
                    </section>
                    <section id="intellectual-property" className="section-help">
                        <h3 className="margin-b-16">Intellectual Property</h3>
                            <p className="margin-b-16">
                                Lorem Impsum Salt 
                            </p>
                    </section>
                    <section id="termination-of-accounts" className="section-help">
                        <h3 className="margin-b-16">Termination of Accounts</h3>
                            <p className="margin-b-16">
                                Lorem Impsum Salt 
                            </p>
                    </section>
                    <section id="changes-to-terms-and-conditions" className="section-help">
                        <h3 className="margin-b-16">Changes to Terms and Conditions</h3>
                        <p className="margin-b-16">
                                We may update this Terms and Conditions from time to time. Any significant changes will be communicated via email or through a notification on the platform.
                                Please review this page periodically for updates.
                            </p>
                    </section>
                    <section id="dispute-resolution" className="section-help">
                        <h3 className="margin-b-16">Dispute Resolution</h3>
                            <p className="margin-b-16">
                                Lorem Impsum Salt 
                            </p>
                    </section>
                    <section id="contact-information" className="section-help">
                        <h3 className="margin-b-16">Contact Information</h3>
                            <p className="margin-b-16">
                            If you have any questions or concerns about this Terms of Service, please contact us at: <span className="text-500">
                            <a href={`mailto:hello@gingham.nyc`} target="_blank" rel="noopener noreferrer"> hello@gingham.nyc</a></span>                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default TermsOfService