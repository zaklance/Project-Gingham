import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminHelpTab from './AdminHelpTab'

const AdminHelp = () => {
    const [activeTab, setActiveTab] = useState('user');
    const [userFAQs, setUserFAQs] = useState([]);
    const [vendorFAQs, setVendorFAQs] = useState([]);
    const [adminFAQs, setAdminFAQs] = useState([]);


    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);
    
    useEffect(() => {
        fetch("/api/faqs")
            .then(response => response.json())
            .then(data => {
                setUserFAQs(data.filter((faq) => faq.for_user === true));
                setVendorFAQs(data.filter((faq) => faq.for_vendor === true));
                setAdminFAQs(data.filter((faq) => faq.for_admin === true));
            })
            .catch(error => console.error('Error fetching products', error));
    }, []);

    const handleToggle = (name) => {
        setOpenFAQ((prev) => (prev === name ? null : name));
    };


    return (
        <>
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                <h1>Admin Help Center</h1>
                <div className='tabs'>
                    <Link to="/help?tab=user" onClick={() => setActiveTab('user')} className={`btn btn-reset btn-tab ${activeTab === 'user' && 'active-tab'}`}>
                        User
                    </Link>
                    <Link to="/help?tab=vendor" onClick={() => setActiveTab('vendor')} className={`btn btn-reset btn-tab ${activeTab === 'vendor' && 'active-tab'}`}>
                        Vendor
                    </Link>
                    <Link to="/help?tab=admin" onClick={() => setActiveTab('admin')} className={`btn btn-reset btn-tab ${activeTab === 'admin' && 'active-tab'}`}>
                        Admin
                    </Link>
                </div>
            </div>
            {activeTab === 'user' && <AdminHelpTab fAQs={userFAQs} setFAQs={setUserFAQs} forUser={true} forVendor={false} forAdmin={false} userType={"User"} />}
            {activeTab === 'vendor' && <AdminHelpTab fAQs={vendorFAQs} setFAQs={setVendorFAQs} forUser={false} forVendor={true} forAdmin={false} userType={"Vendor"} />}
            {activeTab === 'admin' && <AdminHelpTab fAQs={adminFAQs} setFAQs={setAdminFAQs} forUser={false} forVendor={false} forAdmin={true} userType={"Admin"} />}
        </>
    );
};

export default AdminHelp;