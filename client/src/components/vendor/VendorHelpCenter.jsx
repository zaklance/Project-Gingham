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
                <div className='tabs margin-t-20 margin-l-24'>
                    <Link to="#" onClick={() => setActiveTab('faqs')} className={activeTab === 'faqs' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        FAQs
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('guide')} className={activeTab === 'guide' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
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