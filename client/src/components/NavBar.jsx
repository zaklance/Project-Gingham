// NavBar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ginghamLogo from '../assets/images/gingham-logo-3.svg';
import '../assets/css/index.css';

function NavBar({ amountInCart, isPopup, setIsPopup, handlePopup }) {
    const location = useLocation();
    const userId = globalThis.sessionStorage.getItem('userId');

    const isLoggedIn = userId && location.pathname !== '/' && location.pathname !== '/login';

    return (
        <nav className="nav-bar">
            <ul>
                <img className='logo' src={ginghamLogo} alt="Gingham Logo" />
                {isLoggedIn ? (
                    <>
                        <li>
                            <button className='nav-tab color-2'>
                                <NavLink reloadDocument to={`/profile/${userId}`}>Profile</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-3'>
                                <NavLink reloadDocument to="/markets">Markets</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-4'>
                                <NavLink reloadDocument to="/vendors">Vendors</NavLink>
                            </button>
                        </li>
                        <li>
                            <button className='nav-tab color-5'>
                                <NavLink reloadDocument to="/cart">Cart ({amountInCart})</NavLink>
                            </button>
                        </li>
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-6 tab-right'>
                                <NavLink reloadDocument to="/logout">Logout</NavLink>
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            <button className='nav-tab color-1'>
                                <NavLink reloadDocument to="/">Home</NavLink>
                            </button>
                        </li>
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-6 tab-right' onClick={handlePopup} >
                                Login/Signup
                            </button>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
}

export default NavBar;