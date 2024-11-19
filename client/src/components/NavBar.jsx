import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../assets/css/index.css';

function NavBar({ amountInCart, isPopup, setIsPopup, handlePopup }) {
    const location = useLocation();
    const user_id = globalThis.sessionStorage.getItem('user_id');
    const vendor_id = globalThis.sessionStorage.getItem('vendor_user_id');
    const admin_id = globalThis.sessionStorage.getItem('admin_user_id');
    const isUserLoggedIn = user_id;
    const isVendorLoggedIn = vendor_id;
    const isAdminLoggedIn = admin_id;
    // const isLoggedIn = user_id && location.pathname !== '/' && location.pathname !== '/login';
    const isNotUser = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');
    const isVendorPage = location.pathname.startsWith('/vendor');
    const isAdminPage = location.pathname.startsWith('/admin');

    return (
        <nav className="nav-bar">
            <ul>
                <NavLink className="btn-home" reloadDocument to="/" ><img className='logo' src="/site-images/gingham-logo-3.svg" alt="Gingham Logo" /></NavLink>
                {/* User Tabs */}
                {!isNotUser && (
                    <>
                        <li>
                            <NavLink className='nav-tab color-3 btn-nav' reloadDocument to="/user/markets">Markets</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav' reloadDocument to="/user/vendors">Vendors</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-5 btn-nav nowrap' reloadDocument to="/user/your-cart">Cart ({amountInCart})</NavLink>
                        </li>
                    </>
                )}
                {/* Vendor Tabs */}
                {isVendorLoggedIn && isVendorPage && (
                    <>
                        <li>
                            <NavLink className='nav-tab color-3 btn-nav' reloadDocument to="/vendor/dashboard">Dashboard</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav' reloadDocument to="/vendor/sales">Sales</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-5 btn-nav' reloadDocument to={`/vendor/profile/${vendor_id}`}>Profile</NavLink>
                        </li>
                    </>
                )}
                {/* Admin Tabs */}
                {isAdminLoggedIn && isAdminPage && (
                    <>
                        <li>
                            <NavLink className='nav-tab color-3 btn-nav' reloadDocument to={`/admin/profile/${admin_id}`}>Profile</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-5 btn-nav' reloadDocument to={`/admin/markets`}>Markets</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-4 btn-nav' reloadDocument to={`/admin/vendors`}>Vendors</NavLink>
                        </li>
                        <li>
                            <NavLink className='nav-tab color-1 btn-nav' reloadDocument to={`/admin/users`}>Users</NavLink>
                        </li>
                    </>
                )}
                {/* User Login / Logout */}
                {isUserLoggedIn && !isVendorPage && !isAdminPage ?  (
                    <>
                        <li>
                            <NavLink className='nav-tab color-2 btn-nav' reloadDocument to={`/user/profile/${user_id}`}>Profile</NavLink>
                        </li>
                        {/* <li>
                            <NavLink className='nav-tab color-1 btn-nav' reloadDocument to="/notifications"><img className='img-notifications' src="/site-images/notifications-1.svg" alt="Notification" /></NavLink>
                        </li> */}
                        <li style={{ marginLeft: 'auto' }}>
                            <NavLink className='nav-tab color-3 tab-right btn-nav' reloadDocument to="/user/logout">Logout</NavLink>
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
                            <NavLink className='nav-tab color-3 tab-right btn-nav' reloadDocument to="/vendor/logout">Logout</NavLink>
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
                            <NavLink className='nav-tab color-3 tab-right btn-nav' reloadDocument to="/admin/logout">Logout</NavLink>
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