import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VendorActiveVendor from './VendorActiveVendor';
import VendorSalesHistory from './VendorSalesHistory';
import VendorSalesStatements from './VendorSalesStatements';
import VendorSalesPayout from './VendorSalesPayout';


function VendorSales() {
    const [activeTab, setActiveTab] = useState('history');
    const [baskets, setBaskets] = useState([]);
    const [vendorId, setVendorId] = useState(null);
    const [isOnboarded, setIsOnboarded] = useState(false);

    const vendorUserId = localStorage.getItem('vendor_user_id');

    useEffect(() => {            
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    const fetchVendorId = async () => {
        if (!vendorUserId) {
            console.error("No vendor user ID found in local storage");
            return;
        }
        try {
            const token = localStorage.getItem('vendor_jwt-token');
            const response = await fetch(`/api/vendor-users/${vendorUserId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setVendorId(data.vendor_id[[data.active_vendor]]);
            } else {
                console.error('Failed to fetch vendor user data');
            }
        } catch (error) {
            console.error('Error fetching vendor user data:', error);
        }
    };

    useEffect(() => {
        fetchVendorId();
    }, [vendorUserId]);

    useEffect(() => {
        if (vendorId) {
            fetch(`/api/baskets?vendor_id=${vendorId}`)
                .then(response => response.json())
                .then(data => {
                    setBaskets(data)
                    organizeByMonth(data);
                })
                .catch(error => console.error('Error fetching baskets', error));
        }
    }, [vendorId]);

    useEffect(() => {
        if (vendorId) {
            fetch(`/api/vendors/${vendorId}`)
                .then(response => response.json())
                .then(data => {
                    setIsOnboarded(data.is_onboarded)
                })
                .catch(error => console.error('Error fetching baskets', error));
        }
    }, [vendorId]);


    return (
        <>
            <VendorActiveVendor className={'box-bounding'} />
            <div className='flex-start flex-center-align flex-gap-24 m-flex-wrap margin-t-16'>
                <h1>Vendor Sales</h1>
                <div className='tabs margin-l-24 m-flex-wrap'>
                    <Link to="/vendor/sales?tab=history" onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        History
                    </Link>
                    <Link to="/vendor/sales?tab=statements" onClick={() => setActiveTab('statements')} className={activeTab === 'statements' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        Statements
                    </Link>
                    <Link to="/vendor/sales?tab=payout" onClick={() => setActiveTab('payout')} className={activeTab === 'payout' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        Payout
                    </Link>
                </div>
            </div>

            {activeTab === 'history' && <VendorSalesHistory baskets={baskets} vendorId={vendorId} />}
            {activeTab === 'statements' && <VendorSalesStatements baskets={baskets} vendorId={vendorId} />}
            {activeTab === 'payout' && <VendorSalesPayout vendorId={vendorId} />}

            
            
        </>
    )
}

export default VendorSales;