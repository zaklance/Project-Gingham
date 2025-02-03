import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import '../assets/css/index.css';

function NavBar({ amountInCart, isPopup, setIsPopup, handlePopup }) {
    const [notifications, setNotifications] = useState([]);
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [vendorNotifications, setVendorNotifications] = useState([]);
    const [isNotifPopup, setIsNotifPopup] = useState(false);
    const [adminUserData, setAdminUserData] = useState(null);

    const location = useLocation();
    const userId = globalThis.localStorage.getItem('user_id');
    const vendorUserId = globalThis.localStorage.getItem('vendor_user_id');
    const adminUserId = globalThis.localStorage.getItem('admin_user_id');
    const isUserLoggedIn = userId;
    const isVendorLoggedIn = vendorUserId;
    const isAdminLoggedIn = adminUserId;
    const isNotUser = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');
    const isVendorPage = location.pathname.startsWith('/vendor');
    const isAdminPage = location.pathname.startsWith('/admin');

    const navigate = useNavigate();
    const userToken = localStorage.getItem('user_jwt-token');
    const vendorToken = localStorage.getItem('vendor_jwt-token');
    const adminToken = localStorage.getItem('admin_jwt-token');


    useEffect(() => {
    if (isUserLoggedIn) {
        fetch(`http://127.0.0.1:5555/api/user-notifications?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json',
            },
        })
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
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }
            setNotifications((prev) => prev.filter((notif) => notif.id !== notifId));
        } catch (error) {
            console.error("Error deleting notification", error);
        }
    };

    // useEffect(() => {
    //     const fetchVendorUserData = async () => {
    //         if (vendorUserId) {
    //             try {
    //                 const response = await fetch(`http://127.0.0.1:5555/api/vendor-users/${vendorUserId}`, {
    //                     method: 'GET',
    //                     headers: {
    //                         'Authorization': `Bearer ${vendorToken}`,
    //                         'Content-Type': 'application/json'
    //                     }
    //                 });
    //                 if (!response.ok) {
    //                     console.error('Failed to fetch vendor user data:', response.statusText);
    //                     return;
    //                 }
    //                 const data = await response.json();
    //                 setVendorUserData(data);
    //                 // console.log('Fetched Vendor User Data:', data);
    //                 // console.log('Vendor User ID:', vendorUserId);

    //             } catch (error) {
    //                 console.error('Error fetching vendor user data:', error);
    //             }
    //         }
    //     };
    //     fetchVendorUserData();
    // }, [vendorUserId]);


    useEffect(() => {
        if (isVendorLoggedIn) {
            fetch(`http://127.0.0.1:5555/api/vendor-notifications?vendor_user_id=${vendorUserId}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${vendorToken}`,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(data => {
                    setVendorNotifications(data.notifications || []);
                })
                .catch(error => console.error('Error fetching notifications', error));
        }
    }, [isVendorLoggedIn]);

    const handleUserNotificationIsRead = async (notifId, link) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/user-notifications/${notifId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${userToken}`, 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_read: true
                }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                setNotifications((prevNotifications) =>
                    prevNotifications.map((notification) =>
                        notification.id === notifId
                            ? { ...notification, is_read: true }
                            : notification
                    )
                );
                // console.log('Notification updated successfully:', updatedData);
                if (link === 'link') {
                    setIsNotifPopup(false)
                }
            } else {
                console.error('Failed to update notification:', await response.text());
            }
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    const handleUserNotificationClear = async () => {
        if (confirm(`Are you sure you want to clear all your notifications?`)) {
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/user-notifications?user_id=${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${userToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    setNotifications([]);
                    const updatedData = await response.json();
                    console.log('Notification updated successfully:', updatedData);
                    setIsNotifPopup(false)
                } else {
                    console.error('Failed to update notification:', await response.text());
                }
            } catch (error) {
                console.error('Error updating notification:', error);
            }
        }
    }

    const handleVendorNotificationIsRead = async (notifId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications/${notifId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${vendorToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_read: true
                }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                setVendorNotifications((prevNotifications) =>
                    prevNotifications.map((notification) =>
                        notification.id === notifId
                            ? { ...notification, is_read: true }
                            : notification
                    )
                );
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
                headers: {
                    'Authorization': `Bearer ${vendorToken}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }
            setVendorNotifications((prev) => prev.filter((notif) => notif.id !== notifId));
        } catch (error) {
            console.error("Error deleting notification", error);
        }
    };

    const handleVendorUserNotificationClear = async () => {
        if (confirm(`Are you sure you want to clear all your notifications?`)) {
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/vendor-notifications?vendor_user_id=${vendorUserId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${vendorToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const updatedData = await response.json();
                    setVendorNotifications((prev) => prev.filter((notif) => notif.subject === 'team-request'));
                    console.log('Notification updated successfully:', updatedData);
                    setIsNotifPopup(false)
                } else {
                    console.error('Failed to update notification:', await response.text());
                }
            } catch (error) {
                console.error('Error updating notification:', error);
            }
        }
    }
    
    useEffect(() => {
        if (isAdminLoggedIn) {
            fetch("http://127.0.0.1:5555/api/admin-notifications", {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json',
                }
            })
                .then(response => response.json())
                .then(data => {
                    setAdminNotifications(data);
                })
                .catch(error => console.error('Error fetching notifications', error));
        }
    }, [isAdminLoggedIn]);

    const handleAdminNotificationIsRead = async (notifId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/admin-notifications/${notifId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    is_read: true
                }),
            });
            if (response.ok) {
                const updatedData = await response.json();
                setAdminNotifications((prevNotifications) =>
                    prevNotifications.map((notification) =>
                        notification.id === notifId
                            ? { ...notification, is_read: true }
                            : notification
                    )
                );
                console.log('Notification updated successfully:', updatedData);
            } else {
                console.error('Failed to update notification:', await response.text());
            }
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    const handleAdminNotificationDelete = async (notifId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/admin-notifications/${notifId}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) {
                throw new Error("Failed to delete notification");
            }
            setNotifications((prev) => prev.filter((notif) => notif.id !== notifId));
        } catch (error) {
            console.error("Error deleting notification", error);
        }
    };

    const handleAdminNotificationClear = async () => {
        if (confirm(`Are you sure you want to clear all your notifications?`)) {
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/admin-notifications?admin_id=${adminUserId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const updatedData = await response.json();
                    setAdminNotifications((prev) => prev.filter((notif) => notif.subject === 'product-request'));
                    console.log('Notification updated successfully:', updatedData);
                    setIsNotifPopup(false)
                    window.location.reload()
                } else {
                    console.error('Failed to update notification:', await response.text());
                }
            } catch (error) {
                console.error('Error updating notification:', error);
            }
        }
    }

    useEffect(() => {
        if (!adminUserId) return
        const fetchUserData = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5555/api/admin-users/${adminUserId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAdminUserData(data);
                } else {
                    console.error('Error fetching profile:', response.status);
                    if (response.status === 401) {
                        console.error('Unauthorized: Token may be missing or invalid');
                    }
                }
            } catch (error) {
                console.error('Error fetching vendor data:', error);
            }
        };
        fetchUserData();
    }, [adminUserId]);

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
                            <NavLink className='nav-tab m-tab-left color-5 btn-nav' to="/user/markets" state={{ resetFilters: true }} title="Markets">Markets</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-3 btn-nav' to="/user/vendors" state={{ resetFilters: true }} title="Vendors">Vendors</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav nowrap' to="/user/your-cart" title="Cart">Cart {amountInCart > 0 ? `(${amountInCart})` : null}</NavLink>
                        </li>
                    </>
                )}
                {/* Vendor Tabs */}
                {isVendorLoggedIn && isVendorPage && (
                    <>
                        <li>
                            <NavLink className='nav-tab m-tab-left color-3 btn-nav' to={`/vendor/dashboard`} title="Dashboard">Dashboard</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-5 btn-nav' to={`/vendor/sales`} title="Sales">Sales</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav' to={`/vendor/scan`} title="Scan">Scan</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-1 btn-nav' to={`/vendor/profile/${vendorUserId}`} title="Profile">Profile</NavLink>
                        </li>
                        {vendorNotifications.length > 0 &&
                            <li className='notification' onClick={handleVendorNotifPopup}>
                                <a className='nav-tab color-2 btn-nav nav-tab-wide icon-notif' to="/notifications" title="Notifications">&emsp;</a>
                                {vendorNotifications.filter(notification => !notification.is_read).length > 0 && (
                                    <p className='badge'>{vendorNotifications.filter(notification => !notification.is_read).length}</p>
                                )}
                            </li>
                        }
                        <div className='notification'>
                            {vendorNotifications.length > 0 &&
                                <div className={`popup-notif ${isNotifPopup ? 'popup-notif-on' : ''}`} style={{ top: window.scrollY }}>
                                    <ul className='flex-start flex-wrap ul-notif'>
                                        <li className='btn btn-clear' onClick={handleVendorUserNotificationClear}>
                                            Clear All Notifications
                                        </li>
                                        {vendorNotifications
                                            .map((notification) => (
                                                <li key={notification.id} className='li-notif'>
                                                    <div className='flex-start badge-container'>
                                                        {notification.subject == 'team-request' ?
                                                            <button className='btn btn-unreport btn-notif' onClick={() => handleVendorNotificationIsRead(notification.id)}>o</button>
                                                            : <button className='btn btn-unreport btn-notif' onClick={() => handleVendorNotificationDelete(notification.id)}>x</button>}
                                                        {notification.link ? <NavLink className="link-plain scale-102" to={notification.link} onClick={() => handleVendorNotificationIsRead(notification.id)}>{notification.message}</NavLink>
                                                            : <p onClick={() => handleVendorNotificationIsRead(notification.id)}>{notification.message}</p>}
                                                        {!notification.is_read && <button className='btn btn-report btn-unread'>&emsp;</button>}
                                                    </div>
                                                </li>
                                        ))}
                                    </ul>
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
                            <NavLink className='nav-tab m-tab-left color-3 btn-nav' to={`/admin/profile/${adminUserId}`} title="Profile">Profile</NavLink>
                        </li>
                        {adminUserData && adminUserData.admin_role <= 4 ? (
                            <li>
                                <NavLink className='nav-tab color-5 btn-nav' to={`/admin/markets`} title="Markets">Markets</NavLink>
                            </li>
                        ) : null}
                        {adminUserData && adminUserData.admin_role <= 3 ? (
                            <>
                                <li>
                                    <NavLink className='nav-tab color-4 btn-nav' to={`/admin/vendors`} title="Vendors">Vendors</NavLink>
                                </li>
                                <li>
                                    <NavLink className='nav-tab color-1 btn-nav' to={`/admin/users`} title="Users">Users</NavLink>
                                </li>
                            </>
                        ) : (
                            null
                        )}
                        <li>
                            <NavLink className='nav-tab color-2 btn-nav' to={`/admin/help`} title="Help">Help</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-5 btn-nav' to={`/admin/blog`} title="Blog">Blog</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-3 btn-nav icon-report' to={`/admin/report`} title="Reported Reviews">&emsp;</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav icon-email' to={`/admin/email`} title="Email">&emsp;</NavLink>
                        </li>
                        {adminUserData && adminUserData.admin_role <= 2 ? (
                            <li>
                                <NavLink className='nav-tab color-2 btn-nav icon-stats' to={`/admin/stats`} title="Stats">&emsp;</NavLink>
                            </li>
                        ) : (
                            null
                        )}
                        {adminNotifications.length > 0 &&
                            <li className='notification' onClick={handleAdminNotifPopup}>
                                <a className='nav-tab color-2 btn-nav nav-tab-wide icon-notif' to="/notifications" title="Notifications">&emsp;</a>
                                {adminNotifications.length > 0 && <p className='badge'>{adminNotifications.length}</p>}
                            </li>
                        }
                        <div className='notification'>
                            {adminNotifications.length > 0 &&
                                <div className={`popup-notif ${isNotifPopup ? 'popup-notif-on' : ''}`} style={{ top: window.scrollY }}>
                                    <ul className='flex-start flex-wrap ul-notif'>
                                        <li className='btn btn-clear' onClick={handleAdminNotificationClear}>
                                            Clear All Notifications
                                        </li>
                                        {adminNotifications.map((notification) => (
                                            <li key={notification.id} className='li-notif'>
                                                <div className='flex-start badge-container'>
                                                    {notification.subject == 'product-request' ?
                                                        <button className='btn btn-unreport btn-notif' onClick={() => handleAdminNotificationIsRead(notification.id)}>o</button>
                                                        : <button className='btn btn-unreport btn-notif' onClick={() => handleAdminNotificationDelete(notification.id)}>x</button>}
                                                    <NavLink className='link-plain scale-102' to={notification.link} onClick={() => handleAdminNotificationIsRead(notification.id)}>{notification.message}</NavLink>
                                                    {!notification.is_read && <button className='btn btn-report btn-unread'>&emsp;</button>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
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
                            <NavLink className='nav-tab color-2 btn-nav nowrap' to={`/user/pick-up`} title="Pick-Up">Pick-Up</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-1 btn-nav' to={`/user/profile/${userId}`} title="Profile">Profile</NavLink>
                        </li>
                        {notifications.length > 0 &&
                            <li className='notification' onClick={handleNotifPopup}>
                                <a className='nav-tab color-4 btn-nav nav-tab-wide icon-notif' to="/notifications" title="Notifications">&emsp;</a>
                                {notifications.length > 0 && <p className='badge'>{notifications.length}</p>}
                            </li>
                        }
                        <div className='notification'>
                            {notifications.length > 0 &&
                                <div className={`popup-notif ${isNotifPopup ? 'popup-notif-on' : ''}`} style={{ top: window.scrollY }}>
                                    <ul className='flex-start flex-wrap ul-notif'>
                                        <li className='btn btn-clear' onClick={handleUserNotificationClear}>
                                            Clear All Notifications
                                        </li>
                                        {notifications.map((notification) => (
                                            <li key={notification.id} className='li-notif'>
                                                <div className='flex-start badge-container'>
                                                    <button className='btn btn-unreport btn-notif' onClick={() => handleNotificationDelete(notification.id)}>x</button>
                                                    <NavLink className="link-plain scale-102" to={notification.link} onClick={() => handleUserNotificationIsRead(notification.id, 'link')}>
                                                        {notification.message}
                                                    </NavLink>
                                                    {!notification.is_read && <button className='btn btn-unread' onClick={() => handleUserNotificationIsRead(notification.id)}>&emsp;</button>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            }
                            {isNotifPopup && (
                                <div className="popup-overlay" onClick={closePopup}></div>
                            )}
                        </div>
                        <li style={{ marginLeft: 'auto' }}>
                            <NavLink className='nav-tab color-3 tab-right btn-nav' to="/user/logout" title="Logout">Logout</NavLink>
                        </li>
                    </>
                ) : (
                    !isNotUser && (
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right btn-nav btn-nav-login' onClick={handlePopup} title="Login/Signup">
                                Login/Signup
                            </button>
                        </li>
                    )
                )}
                {/* Vendor Login / Logout */}
                {isVendorLoggedIn && isVendorPage ?  (
                    <>
                        <li style={{ marginLeft: 'auto' }}>
                            <NavLink className='nav-tab color-3 tab-right btn-nav' to="/vendor/logout" title="Logout">Logout</NavLink>
                        </li>
                    </>
                ) : (
                    isVendorPage && (
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right btn-nav btn-nav-login' onClick={handlePopup} title="Login/Signup">
                                Login/Signup
                            </button>
                        </li>
                    )
                )}
                {/* Admin Login / Logout */}
                {isAdminLoggedIn && isAdminPage ?  (
                    <>
                        <li style={{ marginLeft: 'auto' }}>
                            <NavLink className='nav-tab color-3 tab-right btn-nav' to="/admin/logout" title="Logout">Logout</NavLink>
                        </li>
                    </>
                ) : (
                    isAdminPage && (
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right btn-nav btn-nav-login' onClick={handlePopup} title="Login/Signup">
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