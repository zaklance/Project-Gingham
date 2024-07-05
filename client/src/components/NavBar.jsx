import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import ginghamLogo from '../assets/images/gingham-2_1200px.png';
import '../assets/css/index.css';

function NavBar() {
    const location = useLocation();

    const isLoggedIn = location.pathname !== '/' && location.pathname !== '/login';

    return (
        <nav className="container">
            <ul>
                <img src={ginghamLogo} alt="Gingham Logo" style={{ width: '40px' }}></img>
                <li>
                    <button><NavLink to="/">Home</NavLink></button>
                </li>
                {isLoggedIn ? (
                    <>
                        <li>
                            <button><NavLink to="/profile">Profile</NavLink></button>
                        </li>
                        <li>
                            <button><NavLink to="/markets">Markets</NavLink></button>
                        </li>
                        <li>
                            <button><NavLink to="/vendors">Vendors</NavLink></button>
                        </li>
                        <li style={{ marginLeft: 'auto' }}>
                            <button><NavLink to="/cart">Cart</NavLink></button>
                        </li>
                        <li style={{ marginLeft: 'auto' }}>
                            <button><NavLink to="/">Logout</NavLink></button>
                        </li>
                    </>
                ) : (
                    <li style={{ marginLeft: 'auto' }}>
                        <button><NavLink to="/login">Login/Signup</NavLink></button>
                    </li>
                )}
            </ul>
        </nav>
    );
}

export default NavBar;