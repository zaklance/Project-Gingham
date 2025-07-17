import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from "react-router-dom";

function Footer() {
    const [clickedPath, setClickedPath] = useState(null);
    const [subdomain, setSubdomain] = useState('');

    const location = useLocation();

    const adminUserId = globalThis.localStorage.getItem('admin_user_id');
    const isAdminLoggedIn = !!adminUserId;

    const getSubdomain = () => {
        const hostnameParts = window.location.hostname.split('.');

        if (hostnameParts.length > 1) {
            setSubdomain(hostnameParts[0]);
        }
    };

    useEffect(() => {
        getSubdomain()
    }, []);

    const isNotUser = (subdomain == 'vendor' | subdomain == 'admin');
    const isVendorPage = subdomain == 'vendor';
    const isAdminPage = subdomain == 'admin';

    const urlWww = import.meta.env.VITE_URL_WWW;
    const urlVendor = import.meta.env.VITE_URL_VENDOR;
    const urlAdmin = import.meta.env.VITE_URL_ADMIN;

    const navItems = [
        { path: `${urlWww}/`, label: "User Portal" },
        { path: `${urlVendor}/`, label: "Vendor Portal" },
        { path: `${urlAdmin}/`, label: "Admin Portal" },
        { path: `${urlWww}/about`, label: "About", condition: !isNotUser },
        { path: `${urlVendor}/about`, label: "About", condition: isVendorPage },
        { path: `${urlAdmin}/about`, label: "About", condition: isAdminPage },
        { path: `${urlWww}/help`, label: "User Help", condition: !isNotUser },
        { path: `${urlVendor}/help`, label: "Vendor Help", condition: isVendorPage },
        { path: `${urlAdmin}/faqs`, label: "Admin Help", condition: isAdminLoggedIn && isAdminPage },
        { path: `${urlWww}/contact`, label: "Contact", condition: !isNotUser },
        { path: `${urlVendor}/contact`, label: "Contact", condition: isVendorPage },
        { path: `${urlWww}/terms-conditions`, label: "Terms & Conditions", condition: !isNotUser },
        { path: `${urlVendor}/terms-conditions`, label: "Terms & Conditions", condition: isVendorPage },
        { path: `${urlAdmin}/terms-conditions`, label: "Terms & Conditions", condition: isAdminPage },
        { path: `${urlWww}/privacy-policy`, label: "Privacy Policy", condition: !isNotUser },
        { path: `${urlVendor}/privacy-policy`, label: "Privacy Policy", condition: isVendorPage },
        { path: `${urlAdmin}/privacy-policy`, label: "Privacy Policy", condition: isAdminPage }
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
                                    {clickedPath === path && window.location.href === path ? (
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