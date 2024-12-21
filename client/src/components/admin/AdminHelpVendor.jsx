import React from 'react';

const AdminHelpVendor = ({ vendorFAQs, setVendorFAQs }) => {
    return (
        <div>
            <div className='box-bounding'>
                <h2>Add Vendor FAQs</h2>
            </div>
            <div className='box-bounding'>
                <h2>Edit Vendor FAQs</h2>
            </div>
            <div className='box-bounding'>
                <h2>Delete Vendor FAQs</h2>
            </div>
        </div>
    );
};

export default AdminHelpVendor;