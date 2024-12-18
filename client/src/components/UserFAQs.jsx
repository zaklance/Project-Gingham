import React, { useState } from 'react';

function UserFAQs() {
    
    return (
        <div>
            <h1 className='title-med margin-b-24'>User FAQs</h1>
            <details className='faqs'>
                <summary>How does Gingham work for customers?</summary>
                <p>Browse available baskets from local farmers market vendors, 
                    purchase discounted items, and pick them up at a designated time.</p>
            </details>
            <details className='faqs'>
                <summary>What types of baskets can I purchase?</summary>
                <p>Vendors offer “mystery baskets” of surplus or imperfect goods, 
                    including produce, baked items, or packaged foods, often at a 
                    discounted price.</p>
            </details>
            <details className='faqs'>
                <summary>How do I know where to pick up my basket?</summary>
                <p>After purchasing, you’ll receive the pickup location, vendor 
                    details, and a specific time to collect your basket.</p>
            </details>
            <details className='faqs'>
                <summary>Can I choose what’s in my basket?</summary>
                <p>Gingham baskets are pre-bundled by vendors to simplify the 
                    process, but they often include a variety of products.</p>
            </details>
            <details className='faqs'>
                <summary>Is Gingham available at all farmers markets?</summary>
                <p>Gingham is currently launching in select markets, but we’re 
                    expanding quickly! Sign up to stay tuned for updates in your area.</p>
            </details>
            <details className='faqs'>
                <summary>How do I pay for my basket?</summary>
                <p>Payments are made securely through Gingham at the time of purchase, 
                    so pick-up is fast and easy.</p>
            </details>
        </div>
    );
}

export default UserFAQs;