import React from 'react';
import { useRouteError, NavLink } from "react-router-dom";
import '../assets/css/index.css';
// import NavBar from './NavBar';

function Footer() {


    return (
        <>
            <br className='m-br'/>
            <div className='footer'>
                <div className='flex-space-around flex-center-align box-blue'>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink to="/"><strong>Gingham Home</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink to="/vendor"><strong>Vendor Portal</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink to="/admin"><strong>Admin Portal</strong></NavLink>
                        </li>
                    </ul>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink to="/"><strong>About</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink to="/contact"><strong>Contact</strong></NavLink>
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