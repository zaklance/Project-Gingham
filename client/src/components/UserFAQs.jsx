import React, { useState } from 'react';

function UserFAQs() {
    const [openFAQ, setOpenFAQ] = useState(null);
    
    const handleToggle = (name) => {
        setOpenFAQ((prev) => (prev === name ? null : name));
    };

    const faqItems = [
        {
            name: "faq1",
            question: "How does Gingham work for customers?",
            answer: "Browse available baskets from local farmers market vendors, purchase discounted items, and pick them up at a designated time.",
        },
        {
            name: "faq2",
            question: "What types of baskets can I purchase?",
            answer: "Vendors offer “mystery baskets” of surplus or imperfect goods, including produce, baked items, or packaged foods, often at a discounted price.",
        },
        {
            name: "faq3",
            question: "How do I know where to pick up my basket?",
            answer: "After purchasing, you’ll receive the pickup location, vendor details, and a specific time to collect your basket.",
        },
        {
            name: "faq4",
            question: "Can I choose what’s in my basket?",
            answer: "Gingham baskets are pre-bundled by vendors to simplify the process, but they often include a variety of products.",
        },
        {
            name: "faq5",
            question: "Is Gingham available at all farmers markets?",
            answer: "Gingham is currently launching in select markets, but we’re expanding quickly! Sign up to stay tuned for updates in your area.",
        },
        {
            name: "faq6",
            question: "How do I pay for my basket?",
            answer: "Payments are made securely through Gingham at the time of purchase, so pick-up is fast and easy.",
        },
    ];
    
    return (
        <div>
            <h1 className='title-med margin-b-24'>User FAQs</h1>
            {faqItems.map((faq) => (
                <details
                    key={faq.name}
                    className='faqs'
                    open={openFAQ === faq.name}
                    onClick={(e) => {
                        e.preventDefault();
                        handleToggle(faq.name);
                    }}
                >
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                </details>
            ))}
        </div>
    );
}

export default UserFAQs;