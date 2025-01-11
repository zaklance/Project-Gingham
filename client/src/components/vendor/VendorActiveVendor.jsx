import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const VendorActiveVendor = () => {
    const [vendorData, setVendorData] = useState(null);
    const [vendorUserData, setVendorUserData] = useState(null);
    const [activeVendor, setActiveVendor] = useState(null);


    const vendoUserId = parseInt(globalThis.localStorage.getItem('vendor_user_id'));

    useEffect(() => {
            const fetchVendorUserData = async () => {
                try {
                    const token = localStorage.getItem('vendor_jwt-token');
                    const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendoUserId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json' 
                        }
                    });
    
                    const text = await response.text();
    
                    if (response.ok) {
                        try {
                            const data = JSON.parse(text);
                            setVendorUserData({
                                ...data,
                            });
                            setActiveVendor(data.active_vendor)
                        } catch (jsonError) {
                            console.error('Error parsing JSON:', jsonError);
                        }
                    } else {
                        console.error('Error fetching profile:', response.status);
                        if (response.status === 401) {
                            console.error('Unauthorized: Token may be missing or invalid');
                        }
                    }
                } catch (error) {
                    console.error('Error fetching profile data:', error);
                }
            };
            fetchVendorUserData();
        }, [vendoUserId]);

    const handleSaveChanges = async () => {
        try {
            const token = localStorage.getItem('vendor_jwt-token');
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendoUserId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    active_vendor: activeVendor
                }),
            });

            if (response.ok) {
                const updatedData = await response.json();
                setVendorUserData(updatedData);
            } else {
                console.log('Failed to save changes');
            }
            window.location.reload()
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    };

    useEffect(() => {
        const fetchVendorData = async () => {
            if (!vendorUserData || !vendorUserData.vendor_id) return;
            try {
                const vendorIds = Object.values(vendorUserData.vendor_id);
                const vendorRequests = vendorIds.map((id) =>
                    fetch(`http://127.0.0.1:5555/api/vendors/${id}`)
                        .then((response) => {
                            if (response.ok) {
                                return response.json();
                            } else {
                                console.error('Failed to fetch vendor data:', response.status);
                                return null;
                            }
                        })
                        .catch((error) => {
                            console.error(`Error fetching vendor data for ID ${id}:`, error);
                            return null;
                        })
                );
                const allVendorData = await Promise.all(vendorRequests);

                const vendorDataWithIds = allVendorData.reduce((obj, data, index) => {
                    const vendorId = vendorIds[index];
                    if (data) {
                        obj[vendorId] = data;
                    }
                    return obj;
                }, {});

                setVendorData(vendorDataWithIds);
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };
        fetchVendorData();
    }, [vendorUserData]);

    const vendorIdObject = Array.isArray(vendorUserData?.vendor_id)
        ? vendorUserData.vendor_id.reduce((obj, item) => {
            obj[item.id] = item.id;
            return obj;
        }, {})
        : vendorUserData?.vendor_id || {};

    if (!vendorUserData || !vendorUserData.vendor_id || Object.keys(vendorUserData.vendor_id).length < 2) {
        return <></>;
    }

    if (!vendorUserData) {
        return <></>
    }


    return (
        <>
            <div className='box-bounding'>
                <div className='flex-start flex-center-align m-flex-wrap'>
                    <h3 className='margin-r-16'>Active Vendor:</h3>
                    <select
                        name="active_vendor"
                        value={activeVendor || ''}
                        onChange={(e) => setActiveVendor(Number(e.target.value))}
                    >
                        {/* <option value="">Select</option> */}
                        {vendorUserData?.vendor_id ? Object.keys(vendorUserData.vendor_id).map((key) => {
                            const vendorId = vendorUserData.vendor_id[key];
                            const vendor = vendorData?.[vendorId];
                            return (
                            <option key={key} value={vendorUserData.vendor_id[key]}>
                                    {vendor ? vendor.name : ''}
                            </option>
                        )}) : null}
                    </select>
                    <button className='btn btn-switch margin-l-8' onClick={handleSaveChanges}>Set Vendor</button>
                </div>
            </div>
        </>
    );
};

export default VendorActiveVendor;