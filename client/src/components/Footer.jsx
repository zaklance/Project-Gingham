import React from 'react';
import { useRouteError, NavLink } from "react-router-dom";
import '../assets/css/index.css';

function Footer() {
    const isNotUser = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin');
    const isVendorPage = location.pathname.startsWith('/vendor');
    const isAdminPage = location.pathname.startsWith('/admin');
    const adminUserId = globalThis.localStorage.getItem('admin_user_id');
    const isAdminLoggedIn = adminUserId;

    return (
        <>
            <br className='m-br'/>
            <div className='footer'>
                <div className='flex-space-around flex-center-align box-blue'>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink to="/" className="link-underline">User Portal</NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink to="/vendor" className="link-underline">Vendor Portal</NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink to="/admin" className="link-underline">Admin Portal</NavLink>
                        </li>
                        {/* <li className='footer-li'>
                            <a href='https://www.mufo.nyc/' target='_blank' rel="noreferrer noopener">Mû.F.O. Inc</a>
                        </li> */}
                    </ul>
                    <ul className='ul-footer'>
                        {/* <li className='footer-li'>
                            <NavLink to="/">About</NavLink>
                        </li> */}
                        {!isNotUser && (
                            <li className='footer-li'>
                                <NavLink to="/contact" className="link-underline">Contact</NavLink>
                            </li>
                        )}
                        {isVendorPage && (
                            <li className='footer-li'>
                                <NavLink to="/vendor/contact" className="link-underline">Contact</NavLink>
                            </li>
                        )}
                        {!isNotUser && (
                            <li className='footer-li'>
                                <NavLink to="/user/help" className="link-underline">User Help</NavLink>
                            </li>
                        )}
                        {isVendorPage && (
                            <li className='footer-li'>
                                <NavLink to="/vendor/help" className="link-underline">Vendor Help</NavLink>
                            </li>
                        )}
                        {isAdminLoggedIn && isAdminPage && (
                            <li className='footer-li'>
                                <NavLink to="/admin/faqs" className="link-underline">Admin Help</NavLink>
                            </li>
                        )}
                        <li className='footer-li'>
                            <NavLink to="/about" className="link-underline">&copy; Gingham, 2025</NavLink>
                        </li>
                    </ul>
                    <img className='small-logo' src="/site-images/gingham-logo-A_3.svg" alt="Gingham Logo"></img>
                </div>
            </div>
        </>
    )
}

export default Footer;