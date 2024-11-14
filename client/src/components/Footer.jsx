import React from 'react';
import { useRouteError, NavLink } from "react-router-dom";
import '../assets/css/index.css';
// import NavBar from './NavBar';

function Footer() {


    return (
        <>
            <div className='footer'>
                <div className='flex-space-around flex-center-align blue'>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/"><strong>Gingham Home</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/vendor/home"><strong>Vendor Portal</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/admin/home"><strong>Admin Portal</strong></NavLink>
                        </li>
                    </ul>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/"><strong>About</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/contact"><strong>Contact</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <a href='https://www.mufo.nyc/' target='_blank' rel="noreferrer noopener"><strong>Mû.F.O. Inc</strong></a>
                        </li>
                    </ul>
                    <img className='small-logo' src="/site-images/gingham-logo-3.svg" alt="Gingham Logo"></img>
                </div>
            </div>
        </>
    )
}

export default Footer;