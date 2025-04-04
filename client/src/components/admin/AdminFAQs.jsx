import React, { useEffect, useState } from 'react';

function AdminFAQs() {
    const [openFAQ, setOpenFAQ] = useState(null);
    const [fAQs, setFAQs] = useState([]);

    useEffect(() => {
        fetch("/api/faqs?for_admin=True")
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
            <title>Gingham • Admin FAQs</title>
            <h1 className='title-med margin-b-24'>Admin FAQs</h1>
            <details
                key="a"
                className='faqs'
                open={openFAQ === "a"}
                onClick={(e) => {
                    e.preventDefault();
                    handleToggle("a");
                }}
            >
                <summary>What are the Admin Roles?</summary>
                <ul>
                    <li>5 — Can edit, delete, and post Blogs, Emails, Help center, and manage Reported reviews</li>
                    <li>4 — Can also add, edit, and delete Markets</li>
                    <li>3 — Can also add, edit, and delete Vendors, Users, and Vendor-Users</li>
                    <li>2 — Can also edit and delete Admins</li>
                    <li>1 — Cannot be edited by 2</li>
                    <li>0 — Cannot have admin_role edited</li>
                </ul>
            </details>
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

export default AdminFAQs;