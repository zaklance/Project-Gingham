import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VendorFAQs from './VendorFAQs';
import VendorGuide from './VendorGuide';

function VendorHelpCenter() {
    const [activeTab, setActiveTab] = useState('faqs');

    useEffect(() => {            
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab) setActiveTab(tab);
        }, []);

    return(
        <>
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap margin-t-16'>
                <h2 className=''>Vendor Help Center</h2>
                <div className='tabs'>
                    <Link to="#" onClick={() => setActiveTab('faqs')} className={`btn btn-reset btn-tab ${activeTab === 'faqs' && 'active-tab'}`}>
                        FAQs
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('guide')} className={`btn btn-reset btn-tab ${activeTab === 'guide' && 'active-tab'}`}>
                        How-To Guide
                    </Link>

                </div>

            </div>
            {activeTab === 'faqs' && <VendorFAQs />}
            {activeTab === 'guide' && <VendorGuide />}

        </>
    )
}

export default VendorHelpCenter;