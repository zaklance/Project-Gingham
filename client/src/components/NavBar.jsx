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
                    <button className='nav-tab color-1'><NavLink reloadDocument to="/">Home</NavLink></button>
                </li>
                {isLoggedIn ? (
                    <>
                        <li>
                            <button className='nav-tab color-2'><NavLink reloadDocument to="/profile">Profile</NavLink></button>
                        </li>
                        <li>
                            <button className='nav-tab color-3'><NavLink reloadDocument to="/markets">Markets</NavLink></button>
                        </li>
                        <li>
                            <button className='nav-tab color-4'><NavLink reloadDocument to="/vendors">Vendors</NavLink></button>
                        </li>
                        <li>
                            <button className='nav-tab color-5'><NavLink reloadDocument to="/cart">Cart</NavLink></button>
                        </li>
                        <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-6 tab-right'><NavLink reloadDocument to="/logout">Logout</NavLink></button>
                        </li>
                    </>
                ) : (
                    <li style={{ marginLeft: 'auto' }}>
                            <button className='nav-tab color-6 tab-right'><NavLink reloadDocument to="/login">Login/Signup</NavLink></button>
                    </li>
                )}
            </ul>
        </nav>
    );
}

export default NavBar;