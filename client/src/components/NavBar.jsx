import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ginghamLogo from '../assets/images/gingham-logo-3.svg';
import '../assets/css/index.css';

function NavBar({ amountInCart, isPopup, setIsPopup, handlePopup }) {
    const location = useLocation();
    const user_id = globalThis.sessionStorage.getItem('user_id');
    const vendor_id = globalThis.sessionStorage.getItem('vendor_user_id');
    const admin_id = globalThis.sessionStorage.getItem('admin_user_id');
    const isUserLoggedIn = user_id;
    const isVendorLoggedIn = vendor_id;
    const isAdminLoggedIn = vendor_id;
    // const isLoggedIn = user_id && location.pathname !== '/' && location.pathname !== '/login';
    const isNotUser = location.pathname.startsWith('/vndr') || location.pathname.startsWith('/admn');
    const isVendorPage = location.pathname.startsWith('/vndr');
    const isAdminPage = location.pathname.startsWith('/admn');

    return (
        <nav className="nav-bar">
            <ul>
                <NavLink className="btn-home" reloadDocument to="/" ><img className='logo' src={ginghamLogo} alt="Gingham Logo" /></NavLink>
                {/* User Tabs */}
                {!isNotUser && (
                    <>
                        <li>
                            <button className='nav-tab color-3'>
                                <NavLink reloadDocument to="/user/markets">Markets</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-4'>
                            <NavLink reloadDocument to="/user/vendors">Vendors</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-5'>
                            <NavLink reloadDocument to="/user/your-cart">Cart ({amountInCart})</NavLink>
                            </button>
                        </li>
                    </>
                )}
                {/* Vendor Tabs */}
                {isVendorLoggedIn && isVendorPage && (
                    <>
                        <li>
                            <button className='nav-tab color-3'>
                                <NavLink reloadDocument to="/vndr/dashboard">Dashboard</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-4'>
                                <NavLink reloadDocument to="/vndr/sales">Sales</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-5'>
                                <NavLink reloadDocument to={`/vndr/profile/${vendor_id}`}>Profile</NavLink>
                            </button>
                        </li>
                    </>
                )}
                {/* Admin Tabs */}
                {isAdminLoggedIn && isAdminPage && (
                    <>
                        <li>
                            <button className='nav-tab color-3'>
                                <NavLink reloadDocument to="/admn/dashboard">Dashboard</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-5'>
                                <NavLink reloadDocument to={`/admn/profile/${admin_id}`}>Profile</NavLink>
                            </button>
                        </li>
                    </>
                )}
                {/* User Login / Logout */}
                {isUserLoggedIn ?  (
                    <>
                        <li>
                            <button className='nav-tab color-2'>
                                <NavLink reloadDocument to={`/user/profile/${user_id}`}>Profile</NavLink>
                            </button>
                        </li>
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right'>
                                <NavLink reloadDocument to="/user/logout">Logout</NavLink>
                            </button>
                        </li>
                    </>
                ) : (
                    !isNotUser && (
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right' onClick={handlePopup} >
                                Login/Signup
                            </button>
                        </li>
                    )
                )}
                {/* Vendor Login / Logout */}
                {isVendorLoggedIn && isVendorPage ?  (
                    <>
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right'>
                                <NavLink reloadDocument to="/vndr/logout">Logout</NavLink>
                            </button>
                        </li>
                    </>
                ) : (
                    isVendorPage && (
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right' onClick={handlePopup} >
                                Temporary
                            </button>
                        </li>
                    )
                )}
                {/* Admin Login / Logout */}
                {isAdminLoggedIn && isAdminPage ?  (
                    <>
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right'>
                                <NavLink reloadDocument to="/admn/logout">Logout</NavLink>
                            </button>
                        </li>
                    </>
                ) : (
                    isAdminPage && (
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right' onClick={handlePopup} >
                                Temporary
                            </button>
                        </li>
                    )
                )}
            </ul>
        </nav>
    );
}

export default NavBar;