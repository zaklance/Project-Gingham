import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ginghamLogo from '../assets/images/gingham-logo-3.svg';
import '../assets/css/index.css';

function NavBar({ amountInCart, isPopup, setIsPopup, handlePopup }) {
    const location = useLocation();
    const user_id = globalThis.sessionStorage.getItem('user_id');
    const vendor_id = globalThis.sessionStorage.getItem('vendor_user_id');
    const isUserLoggedIn = user_id;
    const isVendorLoggedIn = vendor_id;
    // const isLoggedIn = user_id && location.pathname !== '/' && location.pathname !== '/login';
    const isNotUser = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');
    const isUser = location.pathname.startsWith('/') || location.pathname.startsWith('/user');

    return (
        <nav className="nav-bar">
            <ul>
                <NavLink className="btn-home" reloadDocument to="/" ><img className='logo' src={ginghamLogo} alt="Gingham Logo" /></NavLink>
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
                            <NavLink reloadDocument to="/user/cart">Cart ({amountInCart})</NavLink>
                            </button>
                        </li>
                    </>
                )}
                {isVendorLoggedIn && isNotUser && (
                    <>
                        <li>
                            <button className='nav-tab color-3'>
                                <NavLink reloadDocument to="/vendor/dashboard">Dashboard</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-4'>
                                <NavLink reloadDocument to="/vendor/sales">Sales</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-5'>
                                <NavLink reloadDocument to={`/vendor/profile/${vendor_id}`}>Profile</NavLink>
                            </button>
                        </li>
                    </>
                )}
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
                {isVendorLoggedIn ?  (
                    <>
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right'>
                                <NavLink reloadDocument to="/vendor/logout">Logout</NavLink>
                            </button>
                        </li>
                    </>
                ) : (
                    isNotUser && (
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