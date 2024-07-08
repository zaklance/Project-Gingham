import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ginghamLogo from '../assets/images/gingham-2-alt_1200px.png';
import '../assets/css/index.css';

function NavBar() {
    const location = useLocation();

    const isLoggedIn = location.pathname !== '/' && location.pathname !== '/login';

    return (
        <nav className="nav-bar">
            <ul>
                <img className='logo' src={ginghamLogo} alt="Gingham Logo"></img>
                <li>
                    <button className='nav-tab color-1'><NavLink to="/">Home</NavLink></button>
                </li>
                {isLoggedIn ? (
                    <>
                        <li>
                            <button className='nav-tab color-2'><NavLink to="/profile">Profile</NavLink></button>
                        </li>
                        <li>
                            <button className='nav-tab color-3'><NavLink to="/markets">Markets</NavLink></button>
                        </li>
                        <li>
                            <button className='nav-tab color-4'><NavLink to="/vendors">Vendors</NavLink></button>
                        </li>
                        <li>
                            <button className='nav-tab color-5'><NavLink to="/cart">Cart</NavLink></button>
                        </li>
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-6 tab-right'><NavLink to="/">Logout</NavLink></button>
                        </li>
                    </>
                ) : (
                    <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-6 tab-right'><NavLink to="/login">Login/Signup</NavLink></button>
                    </li>
                )}
            </ul>
        </nav>
    );
}

export default NavBar;