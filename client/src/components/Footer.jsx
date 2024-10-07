import React from 'react';
import { useRouteError, NavLink } from "react-router-dom";
import '../assets/css/index.css';
import ginghamLogo from '../assets/images/gingham-logo-3.svg';
// import NavBar from './NavBar';

function Footer() {


    return (
        <>
            <div className='footer'>
                <div className='flex-start-around blue'>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/"><strong>User Home</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/vendorlogin"><strong>Vendor Home</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/"><strong>Admin Home</strong></NavLink>
                        </li>
                    </ul>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/"><strong>About</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="mailto: hello@gingham.nyc" title="hello@gingham.nyc"><strong>Contact</strong></NavLink>
                        </li>
                        <li className='footer-li'>
                            <a href='https://www.mufo.nyc/' target='_blank' rel="noreferrer noopener"><strong>Mû.F.O. Inc</strong></a>
                        </li>
                    </ul>
                    <img className='small-logo' src={ginghamLogo} alt="Gingham Logo"></img>
                </div>
            </div>
        </>
    )
}

export default Footer;