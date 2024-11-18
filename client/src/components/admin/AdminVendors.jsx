import React, { useEffect, useState } from 'react';

function AdminVendors () {
    const [vendors, setVendors] = useState([]);


    useEffect(() => {
        fetch("http://127.0.0.1:5555/markets")
            .then(response => response.json())
            .then(markets => setVendors(markets))
            .catch(error => console.error('Error fetching markets', error));
    }, []);


    return(
        <div>
            <h2 className='margin-t-16'>Vendor Management</h2>
            <div className='bounding-box'>
                <p>**vendor onboard, emails, etc goes here**</p>
            </div>
        </div>
    )
}

export default AdminVendors;