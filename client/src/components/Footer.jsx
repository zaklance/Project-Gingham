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
                            <NavLink to="/">User Portal</NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink to="/vendor">Vendor Portal</NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink to="/admin">Admin Portal</NavLink>
                        </li>
                        {/* <li className='footer-li'>
                            <a href='https://www.mufo.nyc/' target='_blank' rel="noreferrer noopener">Mû.F.O. Inc</a>
                            </li> */}
                    </ul>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink to="/about">About</NavLink>
                        </li>
                        {!isNotUser && (
                            <li className='footer-li'>
                                <NavLink to="/user/help">User Help</NavLink>
                            </li>
                        )}
                        {isVendorPage && (
                            <li className='footer-li'>
                                <NavLink to="/vendor/help">Vendor Help</NavLink>
                            </li>
                        )}
                        {isAdminLoggedIn && isAdminPage && (
                            <li className='footer-li'>
                                <NavLink to="/admin/faqs">Admin Help</NavLink>
                            </li>
                        )}
                        {!isNotUser && (
                            <li className='footer-li'>
                                <NavLink to="/contact">Contact</NavLink>
                            </li>
                        )}
                        {isVendorPage && (
                            <li className='footer-li'>
                                <NavLink to="/vendor/contact">Contact</NavLink>
                            </li>
                        )}
                        
                    </ul>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink to="/terms-service">Terms & Conditions</NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink to="/privacy-policy">Privacy Policy</NavLink>
                        </li>
                        <li className='footer-li-copy'>
                            &copy; Gingham, 2025
                        </li>
                    </ul>
                    <div>
                        <img className='small-logo m-hidden' src="/site-images/gingham-logo-A_3.svg" alt="Gingham Logo"></img>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Footer;