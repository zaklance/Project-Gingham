import React, { useEffect, useState } from 'react';

function VendorFAQs() {
    const [openFAQ, setOpenFAQ] = useState(null);
    const [fAQs, setFAQs] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:5555/api/faqs?for_vendor=True")
            .then(response => response.json())
            .then(data => {
                setFAQs(data);
            })
            .catch(error => console.error('Error fetching products', error));
    }, []);

    const handleToggle = (name) => {
        setOpenFAQ((prev) => (prev === name ? null : name));
    };


    return (
        <div>
            <h1 className='title-med margin-b-24'>Vendor FAQs</h1>
            {Array.isArray(fAQs) && fAQs.map((faq) => (
                <details
                    key={faq.id}
                    className='faqs'
                    open={openFAQ === faq.id}
                    onClick={(e) => {
                        e.preventDefault();
                        handleToggle(faq.id);
                    }}
                >
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                </details>
            ))}
        </div>
    );
}

export default VendorFAQs;