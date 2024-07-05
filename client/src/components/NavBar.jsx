import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../assets/css/index.css';

function NavBar() {
    const location = useLocation();

    const isLoggedIn = location.pathname !== '/' && location.pathname !== '/login';

    return (
        <nav className="container">
            <ul>
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
                        <li style={{ marginLeft: 'auto' }}>
                            <button>Logout</button>
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