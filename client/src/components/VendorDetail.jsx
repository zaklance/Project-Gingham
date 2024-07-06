import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const VendorDetail = () => {
    const { id } = useParams();
    const [vendor, setVendor] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:3000/vendors/${id}`)
            .then(response => response.json())
            .then(data => setVendor(data))
            .catch(error => console.error('Error fetching vendor data:', error));
    }, [id]);

    if (!vendor) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>{vendor.name}</h2>
            <img src={vendor.image} alt="Vendor Image" style={{width: '100%'}} />
            <p>{vendor.description}</p>
            <h4>Location: {vendor.location}</h4>
            <h4>Hours: {vendor.hours}</h4>
        </div>
    );
};

export default VendorDetail;
