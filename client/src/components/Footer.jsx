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
                            <NavLink to="/">About</NavLink>
                        </li>
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
                        {!isNotUser && (
                            <li className='footer-li'>
                                <NavLink to="/user/faqs">User FAQs</NavLink>
                            </li>
                        )}
                        {isVendorPage && (
                            <li className='footer-li'>
                                <NavLink to="/vendor/faqs">Vendor FAQs</NavLink>
                            </li>
                        )}
                        {isAdminLoggedIn && isAdminPage && (
                            <li className='footer-li'>
                                <NavLink to="/admin/faqs">Admin FAQs</NavLink>
                            </li>
                        )}
                        <li className='footer-li'>
                            &copy; Gingham, 2025
                        </li>
                    </ul>
                    <img className='small-logo' src="/site-images/gingham-logo-A_3.svg" alt="Gingham Logo"></img>
                </div>
            </div>
        </>
    )
}

export default Footer;