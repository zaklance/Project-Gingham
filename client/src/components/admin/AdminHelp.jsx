import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminHelpTab from './AdminHelpTab'

const AdminHelp = () => {
    const [activeTab, setActiveTab] = useState('user');
    const [userFAQs, setUserFAQs] = useState([]);
    const [vendorFAQs, setVendorFAQs] = useState([]);
    const [adminFAQs, setAdminFAQs] = useState([]);


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
                <div className='tabs margin-t-20'>
                    <Link to="#" onClick={() => setActiveTab('user')} className={activeTab === 'user' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        User
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('vendor')} className={activeTab === 'vendor' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Vendor
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
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