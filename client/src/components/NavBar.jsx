import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import '../assets/css/index.css';

function NavBar({ amountInCart, isPopup, setIsPopup, handlePopup }) {
    const [notifications, setNotifications] = useState([]);
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [vendorNotifications, setVendorNotifications] = useState([]);
    const [isNotifPopup, setIsNotifPopup] = useState(false);
    const [vendorUserData, setVendorUserData] = useState(null);

    const location = useLocation();
    const userId = globalThis.localStorage.getItem('user_id');
    const vendorUserId = globalThis.localStorage.getItem('vendor_user_id');
    const admin_id = globalThis.localStorage.getItem('admin_user_id');
    const isUserLoggedIn = userId;
    const isVendorLoggedIn = vendorUserId;
    const isAdminLoggedIn = admin_id;
    // const isLoggedIn = userId && location.pathname !== '/' && location.pathname !== '/login';
    const isNotUser = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');
    const isVendorPage = location.pathname.startsWith('/vendor');
    const isAdminPage = location.pathname.startsWith('/admin');

    const navigate = useNavigate();


    useEffect(() => {
    if (isUserLoggedIn) {
        fetch(`http://127.0.0.1:5555/api/user-notifications?user_id=${userId}`)
            .then(response => response.json())
            .then(data => {
                setNotifications(data);
            })
            .catch(error => console.error('Error fetching notifications', error));
    }
}, [isUserLoggedIn, userId]);

    const handleNotificationDelete = async (notifId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/user-notifications/${notifId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }
            setNotifications((prev) => prev.filter((notif) => notif.id !== notifId));
        } catch (error) {
            console.error("Error deleting notification", error);
        }
    };

    useEffect(() => {
        const fetchVendorUserData = async () => {
            if (vendorUserId) {
                try {
                    const token = localStorage.getItem('vendor_jwt-token');
                    const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) {
                        console.error('Failed to fetch vendor user data:', response.statusText);
                        return;
                    }
                    const data = await response.json();
                    setVendorUserData(data);
                    // console.log('Fetched Vendor User Data:', data);
                    // console.log('Vendor User ID:', vendorUserId);

                } catch (error) {
                    console.error('Error fetching vendor user data:', error);
                }
            }
        };
        fetchVendorUserData();
    }, [vendorUserId]);


    useEffect(() => {
        if (isVendorLoggedIn && vendorUserData) {
            fetch(`http://127.0.0.1:5555/api/vendor-notifications?vendor_id=${vendorUserData.vendor_id}`)
                .then(response => response.json())
                .then(data => {
                    setVendorNotifications(data.notifications || []);
                })
                .catch(error => console.error('Error fetching notifications', error));
        }
    }, [isVendorLoggedIn, vendorUserData]);

    const handleVendorNotificationIsRead = async (notifId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications/${notifId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_read: true
                }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                setVendorNotifications((prev) => prev.filter((item) => item.id !== notifId))
                console.log('Notification updated successfully:', updatedData);
            } else {
                console.error('Failed to update notification:', await response.text());
            }
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    const handleVendorNotificationDelete = async (notifId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications/${notifId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }
            setVendorNotifications((prev) => prev.filter((notif) => notif.id !== notifId));
        } catch (error) {
            console.error("Error deleting notification", error);
        }
    };

    useEffect(() => {
        if (isAdminLoggedIn) {
            fetch("http://127.0.0.1:5555/api/admin-notifications")
                .then(response => response.json())
                .then(data => {
                    setAdminNotifications(data);
                })
                .catch(error => console.error('Error fetching notifications', error));
        }
    }, [isAdminLoggedIn]);

    const handleAdminNotificationDelete = async (notifId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/admin-notifications/${notifId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }
            setNotifications((prev) => prev.filter((notif) => notif.id !== notifId));
        } catch (error) {
            console.error("Error deleting notification", error);
        }
    };

    const handleAdminNotificationLink = () => {
        window.location.href = "/admin/vendors?tab=products";
    }

    const handleNotifPopup = () => {
        if (notifications.length > 0) {
            setIsNotifPopup(!isNotifPopup);
        }
    }
    
    const handleVendorNotifPopup = () => {
        if (vendorNotifications.length > 0) {
            setIsNotifPopup(!isNotifPopup);
        }
    }

    const handleAdminNotifPopup = () => {
        if (adminNotifications.length > 0) {
            setIsNotifPopup(!isNotifPopup);
        }
    }
    
    const closePopup = () => {
        if (isNotifPopup) {
            setIsNotifPopup(false);
        }
    };
    

    return (
        <nav className="nav-bar">
            <ul>
                <NavLink className="btn-home" to="/" ><img className='logo' src="/site-images/gingham-logo-A_3.svg" alt="Gingham Logo" /></NavLink>
                {/* User Tabs */}
                {!isNotUser && (
                    <>
                        <li>
                            <NavLink className='nav-tab m-tab-left color-3 btn-nav' to="/user/markets" state={{ resetFilters: true }}>Markets</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav' to="/user/vendors" state={{ resetFilters: true }}>Vendors</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-5 btn-nav nowrap' to="/user/your-cart">Cart ({amountInCart})</NavLink>
                        </li>
                    </>
                )}
                {/* Vendor Tabs */}
                {isVendorLoggedIn && isVendorPage && (
                    <>
                        <li>
                            <NavLink className='nav-tab m-tab-left color-3 btn-nav' to={`/vendor/dashboard`}>Dashboard</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-5 btn-nav' to={`/vendor/sales`}>Sales</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav' to={`/vendor/profile/${vendorUserId}`}>Profile</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-1 btn-nav' to={`/vendor/scan`}>Scan</NavLink>
                        </li>
                        {vendorNotifications.length > 0 &&
                            <li className='notification' onClick={handleVendorNotifPopup}>
                                <a className='nav-tab color-2 btn-nav nav-tab-wide icon-notif' to="/notifications">&emsp;</a>
                                {vendorNotifications.filter(notification => !notification.is_read).length > 0 && (
                                    <p className='badge'>{vendorNotifications.filter(notification => !notification.is_read).length}</p>
                                )}
                            </li>
                        }
                        <div className='notification'>
                            {vendorNotifications.length > 0 &&
                                <div className={`popup-notif ${isNotifPopup ? 'popup-notif-on' : ''}`} style={{ top: window.scrollY }}>
                                    <div className=''>
                                        <ul className='flex-start flex-wrap ul-notif'>
                                            {vendorNotifications
                                                .filter(notification => !notification.is_read)
                                                .map((notification) => (
                                                    <li key={notification.id} className='li-notif'>
                                                        <div className='flex-start'>
                                                            {notification.subject == 'team-request' ?
                                                                <button className='btn btn-unreport btn-notif' onClick={() => handleVendorNotificationIsRead(notification.id)}>o</button>
                                                                : <button className='btn btn-unreport btn-notif' onClick={() => handleVendorNotificationDelete(notification.id)}>x</button>}
                                                            {notification.link ? <NavLink to={notification.link} onClick={closePopup}>{notification.message}</NavLink>
                                                            : <p>{notification.message}</p>}
                                                        </div>
                                                    </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            }
                            {isNotifPopup && (
                                <div className="popup-overlay" onClick={closePopup}></div>
                            )}
                        </div>
                    </>
                )}
                {/* Admin Tabs */}
                {isAdminLoggedIn && isAdminPage && (
                    <>
                        <li>
                            <NavLink className='nav-tab m-tab-left color-3 btn-nav' to={`/admin/profile/${admin_id}`}>Profile</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-5 btn-nav' to={`/admin/markets`}>Markets</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav' to={`/admin/vendors`}>Vendors</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-1 btn-nav' to={`/admin/users`}>Users</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-2 btn-nav' to={`/admin/help`}>Help</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-5 btn-nav icon-report' to={`/admin/report`}>&emsp;</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-3 btn-nav icon-email' to={`/admin/email`}>&emsp;</NavLink>
                        </li>
                        {adminNotifications.length > 0 &&
                            <li className='notification' onClick={handleAdminNotifPopup}>
                                <a className='nav-tab color-4 btn-nav nav-tab-wide icon-notif' to="/notifications">&emsp;</a>
                                {adminNotifications.length > 0 && <p className='badge'>{adminNotifications.length}</p>}
                            </li>
                        }
                        <div className='notification'>
                            {adminNotifications.length > 0 &&
                                <div className={`popup-notif ${isNotifPopup ? 'popup-notif-on' : ''}`} style={{ top: window.scrollY }}>
                                    <div className=''>
                                        <ul className='flex-start flex-wrap ul-notif'>
                                            {adminNotifications.map((notification) => (
                                                <li key={notification.id} className='li-notif'>
                                                    <div className='flex-start'>
                                                        <button className='btn btn-unreport btn-notif' onClick={() => handleAdminNotificationDelete(notification.id)}>x</button>
                                                        <p className='link-underline' onClick={handleAdminNotificationLink}>{notification.message}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            }
                            {isNotifPopup && (
                                <div className="popup-overlay" onClick={closePopup}></div>
                            )}
                        </div>
                    </>
                )}
                {/* User Login / Logout */}
                {isUserLoggedIn && !isVendorPage && !isAdminPage ?  (
                    <>
                        <li>
                            <NavLink className='nav-tab color-2 btn-nav nowrap' to={`/user/pick-up`}>Pick-Up</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav' to={`/user/profile/${userId}`}>Profile</NavLink>
                        </li>
                        {notifications.length > 0 &&
                            <li className='notification' onClick={handleNotifPopup}>
                                <a className='nav-tab color-1 btn-nav nav-tab-wide icon-notif' to="/notifications">&emsp;</a>
                                {notifications.length > 0 && <p className='badge'>{notifications.length}</p>}
                            </li>
                        }
                        <div className='notification'>
                            {notifications.length > 0 &&
                                <div className={`popup-notif ${isNotifPopup ? 'popup-notif-on' : ''}`} style={{ top: window.scrollY }}>
                                    <div className=''>
                                        <ul className='flex-start flex-wrap ul-notif'>
                                            {notifications.map((notification) => (
                                                <li key={notification.id} className='li-notif'>
                                                    <div className='flex-start'>
                                                        <button className='btn btn-unreport btn-notif' onClick={() => handleNotificationDelete(notification.id)}>x</button>
                                                        <NavLink to={notification.link} onClick={closePopup}>{notification.message}</NavLink>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            }
                            {isNotifPopup && (
                                <div className="popup-overlay" onClick={closePopup}></div>
                            )}
                        </div>
                        <li style={{ marginLeft: 'auto' }}>
                            <NavLink className='nav-tab color-3 tab-right btn-nav' to="/user/logout">Logout</NavLink>
                        </li>
                    </>
                ) : (
                    !isNotUser && (
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right btn-nav btn-nav-login' onClick={handlePopup} >
                                Login/Signup
                            </button>
                        </li>
                    )
                )}
                {/* Vendor Login / Logout */}
                {isVendorLoggedIn && isVendorPage ?  (
                    <>
                        <li style={{ marginLeft: 'auto' }}>
                            <NavLink className='nav-tab color-3 tab-right btn-nav' to="/vendor/logout">Logout</NavLink>
                        </li>
                    </>
                ) : (
                    isVendorPage && (
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right btn-nav btn-nav-login' onClick={handlePopup} >
                                Login/Signup
                            </button>
                        </li>
                    )
                )}
                {/* Admin Login / Logout */}
                {isAdminLoggedIn && isAdminPage ?  (
                    <>
                        <li style={{ marginLeft: 'auto' }}>
                            <NavLink className='nav-tab color-3 tab-right btn-nav' to="/admin/logout">Logout</NavLink>
                        </li>
                    </>
                ) : (
                    isAdminPage && (
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right btn-nav btn-nav-login' onClick={handlePopup} >
                                Login/Signup
                            </button>
                        </li>
                    )
                )}
            </ul>
        </nav>
    );
}

export default NavBar;