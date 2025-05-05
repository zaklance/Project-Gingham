import React, { useState } from 'react';
import { useRouteError, NavLink, useLocation } from "react-router-dom";
import '../assets/css/index.css';

function Footer() {
    const [clickedPath, setClickedPath] = useState(null);

    const location = useLocation();

    const isNotUser = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');
    const isVendorPage = location.pathname.startsWith('/vendor');
    const isAdminPage = location.pathname.startsWith('/admin');
    const adminUserId = globalThis.localStorage.getItem('admin_user_id');
    const isAdminLoggedIn = adminUserId;

    const navItems = [
        { path: "/", label: "User Portal" },
        { path: "/vendor", label: "Vendor Portal" },
        { path: "/admin", label: "Admin Portal" },
        { path: "/about", label: "About" },
        { path: "/user/help", label: "User Help", condition: !isNotUser },
        { path: "/vendor/help", label: "Vendor Help", condition: isVendorPage },
        { path: "/admin/faqs", label: "Admin Help", condition: isAdminLoggedIn && isAdminPage },
        { path: "/contact", label: "Contact", condition: !isNotUser },
        { path: "/vendor/contact", label: "Contact", condition: isVendorPage },
        { path: "/terms-service", label: "Terms & Conditions" },
        { path: "/privacy-policy", label: "Privacy Policy" }
    ];

    const handleClick = (path) => {
        setClickedPath(path);
        setTimeout(() => {
            setClickedPath(null);
        }, 2000);
    };

    return (
        <>
            <br className='m-br'/>
            <div className='footer'>
                <div className='flex-space-around flex-center-align box-blue'>
                    <ul className='ul-footer column-footer'>
                        {navItems.map(({ path, label, condition }) =>
                            condition !== false ? (
                                <li key={path} className="footer-li font-cera text-500 link-underline">
                                    <NavLink 
                                        to={path} 
                                        className={({ isActive }) => isActive ? "active-link" : ""}
                                        onClick={() => handleClick(path)}
                                    >
                                        {label}
                                    </NavLink>
                                    {clickedPath === path && location.pathname === path && (
                                        <div className="notification-box">
                                            <div className="notification-triangle"></div>
                                            You are here!
                                        </div>
                                    )}
                                </li>
                            ) : null
                        )}
                            <li className="footer-li-copy font-cera text-500">&copy; Gingham, 2025</li>
                        </ul>
                        <div>
                            <img className="small-logo" src="/site-images/gingham-logo_04-3A.svg" alt="Gingham Logo" />
                        </div>
                </div>
            </div>
        </>
    )
}

export default Footer;