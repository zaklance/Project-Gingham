// NavBar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ginghamLogo from '../../assets/images/gingham-logo-3.svg';
import '../../assets/css/index.css';

function NavBar({ amountInCart, isPopup, setIsPopup, handlePopup }) {
    const location = useLocation();
    const user_id = globalThis.sessionStorage.getItem('user_id');

    const isLoggedIn = user_id && location.pathname !== '/' && location.pathname !== '/login';

    return (
        <nav className="nav-bar">
            <ul>
                <img className='logo' src={ginghamLogo} alt="Gingham Logo" />
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
                {isLoggedIn ? (
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
                    <>
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-3 tab-right' onClick={handlePopup} >
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