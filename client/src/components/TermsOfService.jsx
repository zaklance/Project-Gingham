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
            <h1 className="title-med margin-b-24">Terms of Service</h1>
            <div className='vendor-guide'>
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
                            <span className="text-500">Effective Date: March 1, 2025</span>
                        </p>
                        <p className="margin-b-16">
                            <strong>Welcome to Gingham!</strong> By accessing or using our platform, you agree to abide by these Terms of Service. These 
                            terms outline the rules and regulations governing your use of our services, including purchasing, selling, and interacting with other users.
                        </p>
                </section>

                <section id="Eligibility and Account Registration" className="section-help">
                    <h3 className="margin-b-16">Eligibility and Account Registration</h3>
                        <p className="margin-b-16">
                            To use Gingham, you must be <strong>at least 18 years old</strong> or have the consent of a legal guardian. By creating an account, 
                            you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your 
                            account credentials and agree to notify us immediately of any unauthorized use of your account.
                        </p>
                </section>

                <section id="Use of Platform" className="section-help">
                    <h3 className="margin-b-16">Use of Platform</h3>
                        <p className="margin-b-16">
                            Gingham provides a platform that connects consumers with local vendors and farmers. Users agree not to engage in fraudulent, 
                            abusive, or otherwise harmful activities. We reserve the right to suspend or terminate accounts that violate these terms.                        
                        </p>
                </section>

                <section id="Purchases and Payment Terms" className="section-help">
                    <h3 className="margin-b-16">Purchases and Payment Terms</h3>
                        <p className="margin-b-16">
                            All purchases made through Gingham are processed securely through Stripe. By placing an order, you agree to pay the total amount, 
                            including any applicable taxes and fees. Gingham is not responsible for third-party payment processing issues but will assist in 
                            resolving disputes when necessary.
                        </p>
                </section>

                <section id="Return and Exchange Policy" className="section-help">
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
                            <a href={`mailto:sales@gingham.nyc`} target="_blank" rel="noopener noreferrer"> sales@gingham.nyc</a>.</strong>
                        </p>
                        <p className="margin-b-16">
                            Please note that any refunds may or may not include transaction fees based on the reason for refund. 
                        </p>
                        <p className="margin-b-16">
                            Thank you for your understanding and support of local farmers and vendors.
                        </p>
                </section>

                <section id="Vendor Terms" className="section-help">
                    <h3 className="margin-b-16">Vendor Terms</h3>
                        <p className="margin-b-16">
                            Vendors are responsible for ensuring that the products they list comply with all applicable laws and regulations. Vendors must fulfill orders 
                            in a timely and professional manner and handle customer inquiries or disputes accordingly. Failure to meet these standards may result in suspension 
                            or removal from the platform.
                        </p>
                </section>

                <section id="Consumer Terms" className="section-help">
                    <h3 className="margin-b-16">Consumer Terms</h3>
                        <p className="margin-b-16">
                            Consumers are expected to provide accurate information when making purchases and to respect the terms set by vendors. Any disputes regarding product 
                            quality or order fulfillment should be addressed with the vendor first. Gingham may facilitate resolution but is not responsible for disputes 
                            between consumers and vendors.
                        </p>
                </section>

                <section id="Text Messaging Policy" className="section-help">
                    <h3 className="margin-b-16">Text Messaging Policy</h3>
                        <p className="margin-b-16">
                            By using our services, you agree to receive text messages from Gingham related to your orders, account status, and promotions. Message frequency may vary.
                        </p>
                        <p className="margin-b-16">
                            <strong>Opt-Out:</strong> You may opt out of SMS notifications at any time by replying "STOP" to any message. Standard carrier messaging rates apply.
                        </p>
                </section>

                <section id="Limitation of Liability" className="section-help">
                    <h3 className="margin-b-16">Limitation of Liability</h3>
                        <p className="margin-b-16">
                            To the fullest extent permitted by law, Gingham and its affiliates shall not be liable for any indirect, incidental, or consequential damages arising from 
                            the use of the platform. Our liability, if any, shall be limited to the amount paid by you for the services provided.
                        </p>
                </section>

                <section id="Intellectual Property" className="section-help">
                    <h3 className="margin-b-16">Intellectual Property</h3>
                        <p className="margin-b-16">
                            All content, trademarks, and intellectual property displayed on the Gingham platform belong to Gingham or respective licensors. Users may not use, reproduce, 
                            or distribute any content without express permission. 
                        </p>
                </section>

                <section id="Termination of Accounts" className="section-help">
                    <h3 className="margin-b-16">Termination of Accounts</h3>
                        <p className="margin-b-16">
                        We reserve the right to suspend or terminate your account at our sole discretion if you violate these Terms of Service, engage in fraudulent activities, 
                        or misuse the platform. If your account is terminated, you will lose access to all services, and any pending transactions may be canceled without refund. 
                        You may request reinstatement by contacting our support team, but approval is not guaranteed. 
                        </p>
                </section>

                <section id="Changes to Terms of Service" className="section-help">
                    <h3 className="margin-b-16">Changes to Terms of Service</h3>
                    <p className="margin-b-16">
                            We may update this Terms of Service from time to time. Any significant changes will be communicated via email or through a notification on the platform.
                            Please review this page periodically for updates.
                        </p>
                </section>

                <section id="Dispute Resolution" className="section-help">
                    <h3 className="margin-b-16">Dispute Resolution</h3>
                        <p className="margin-b-16">
                            Any disputes arising from the use of our services shall be governed by and construed in accordance with the laws of the state of New York, regardless of where 
                            you are located. Any disputes will first be attempted to be resolved informally by contacting Gingham support. If a resolution cannot be reached, disputes 
                            shall be resolved through binding arbitration, conducted in New York, NY, in accordance with the rules of the American Arbitration Association.
                        </p>
                </section>

                <section id="Contact Information" className="section-help">
                    <h3 className="margin-b-16">Contact Information</h3>
                        <p className="margin-b-16">
                            If you have any questions or concerns about this Terms of Service, please contact us at: <span className="text-500">
                            <a href={`mailto:hello@gingham.nyc`} target="_blank" rel="noopener noreferrer"> hello@gingham.nyc</a></span>                        
                        </p>
                </section>
            </div>
        </div>
    </div>
    )
}

export default TermsOfService