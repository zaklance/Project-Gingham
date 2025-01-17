import React, { useEffect, useState } from 'react';



const VendorTeamLeave = ({ className, vendorUserData, setVendorUserData }) => {
    const [vendorsData, setVendorsData] = useState(null);

    const vendorUserId = parseInt(globalThis.localStorage.getItem('vendor_user_id'))

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

                setVendorsData(vendorDataWithIds);
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };
        fetchVendorData();
    }, [vendorUserData]);

    const handleDeleteTeamMember = async (vendorId) => {
        if (confirm(`Are you sure you want to leave this team?`)) {
            try {
                const token = localStorage.getItem('vendor_jwt-token');
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}?delete_vendor_id=${vendorId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        active_vendor: null
                    })
                });

                if (response.ok) {
                    setVendorUserData({
                        ...vendorUserData,
                        vendor_id: Object.fromEntries(
                            Object.entries(vendorUserData.vendor_id).filter(([key]) => key !== String(vendorId))
                        )
                    });
                } else {
                    const errorData = await response.json();
                    console.error('Error updating team member:', errorData);
                }
                window.location.reload()
            } catch (error) {
                console.error('Error updating team member:', error);
            }
        }
    };


    return (
        <div className={className || ''}>
            {vendorUserData?.vendor_id ?(
                <>
                    <h3 className='margin-b-16'>On Vendors' Team:</h3>
                    <ul className='ul-team box-scroll-small'>
                        {vendorUserData?.vendor_id && vendorsData && Object.entries(vendorUserData.vendor_id)
                            .sort((a, b) => {
                                const nameA = vendorsData[a[0]]?.name?.toLowerCase() || 'unknown name';
                                const nameB = vendorsData[b[0]]?.name?.toLowerCase() || 'unknown name';
                                return nameA.localeCompare(nameB);
                            })
                            .map(([key, value]) => (
                                <li key={key} className='li-team'>
                                    <div className='flex-space-between'>
                                        <p><strong>{vendorsData[key]?.name || 'Unknown Name'}</strong> — 
                                            {(() => {
                                                const role = vendorUserData?.vendor_role[value];
                                                if (role == 0) return 'Owner';
                                                if (role == 1) return 'Admin';
                                                if (role == 2) return 'Employee';
                                                return 'Unknown Role';
                                            })()}    
                                        </p>
                                        {key !== vendorUserData.id && vendorUserData.vendor_role[value] != 0 && (
                                            <div className='flex-end flex-center-align'>
                                                <button
                                                    className="btn btn-small btn-unreport"
                                                    onClick={() => handleDeleteTeamMember(key)}
                                                >
                                                    Leave Team
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                        ))}
                    </ul>
                </>
                ) : (
                    null
                )}
        </div>
    );
};

export default VendorTeamLeave;