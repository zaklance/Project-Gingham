import React, { useState } from 'react';
import { useRouteError, NavLink, useLocation } from "react-router-dom";

function Footer() {
    const [clickedPath, setClickedPath] = useState(null);

    const location = useLocation();

    const isNotUser = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');
    const isVendorPage = location.pathname.startsWith('/vendor');
    const isAdminPage = location.pathname.startsWith('/admin');
    const adminUserId = globalThis.localStorage.getItem('admin_user_id');
    const isAdminLoggedIn = !!adminUserId;

    const navItems = [
        { path: "/", label: "User Portal" },
        { path: "/vendor", label: "Vendor Portal" },
        { path: "/admin", label: "Admin Portal" },
        { path: "/about", label: "About", condition: !isNotUser },
        { path: "/vendor/about", label: "About", condition: isVendorPage },
        { path: "/admin/about", label: "About", condition: isAdminPage },
        { path: "/user/help", label: "User Help", condition: !isNotUser },
        { path: "/vendor/help", label: "Vendor Help", condition: isVendorPage },
        { path: "/admin/faqs", label: "Admin Help", condition: isAdminLoggedIn && isAdminPage },
        { path: "/contact", label: "Contact", condition: !isNotUser },
        { path: "/vendor/contact", label: "Contact", condition: isVendorPage },
        { path: "/terms-conditions", label: "Terms & Conditions", condition: !isNotUser },
        { path: "/vendor/terms-conditions", label: "Terms & Conditions", condition: isVendorPage },
        { path: "/admin/terms-conditions", label: "Terms & Conditions", condition: isAdminPage },
        { path: "/privacy-policy", label: "Privacy Policy", condition: !isNotUser },
        { path: "/vendor/privacy-policy", label: "Privacy Policy", condition: isVendorPage },
        { path: "/admin/privacy-policy", label: "Privacy Policy", condition: isAdminPage }
    ];

    const handleClick = (path) => {
        setClickedPath(path);
        setTimeout(() => {
            setClickedPath(null);
        }, 2000);
    };

    function getCurrentYear() {
        return new Date().getFullYear();
    }

    return (
        <>
            <br className='m-br'/>
            <div className='footer'>
                <div className='flex-space-around flex-center-align box-blue m-padding-8'>
                    <ul className='ul-footer column-footer'>
                        {navItems.map(({ path, label, condition }) =>
                            condition !== false && (
                                <li key={path} className="footer-li font-cera text-700 link-underline">
                                    {clickedPath === path && location.pathname === path ? (
                                        <div className="box-here text-underline">
                                            You are here!
                                        </div>
                                    ) : (
                                        <NavLink 
                                            to={path} 
                                            className={({ isActive }) => isActive ? "active-link" : ""}
                                            onClick={() => handleClick(path)}
                                        >
                                            {label}
                                        </NavLink>
                                    )}
                                </li>
                            )
                        )}
                        <li className="footer-li-copy text-line-1-4 text-500">&copy; {getCurrentYear()} <span className='font-cera-gingham text-line-1-4'>GINGHAM NYC</span></li>
                    </ul>
                    <div>
                        <img className="small-logo" src="/site-images/gingham-logo_04-3A.svg" alt="gingham logo" />
                    </div>
                </div>
            </div>
        </>
    )
}

export default Footer;