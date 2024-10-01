import React from 'react';
import { useRouteError, NavLink } from "react-router-dom";
import '../../assets/css/index.css';
import ginghamLogo from '../../assets/images/gingham-logo-3.svg';
// import NavBar from './NavBar';

function Footer() {


    return (
        <>
            <div className='footer'>
                <div className='flex-start-around blue'>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/">User Home</NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/">Vendor Home</NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/">Admin Home</NavLink>
                        </li>
                    </ul>
                    <ul className='ul-footer'>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/">About</NavLink>
                        </li>
                        <li className='footer-li'>
                            <NavLink reloadDocument to="/">Contact</NavLink>
                        </li>
                        <li className='footer-li'>
                            <a href='https://www.mufo.nyc/' target='_blank' rel="noreferrer noopener">Mû.F.O. Inc</a>
                        </li>
                    </ul>
                    <img className='small-logo' src={ginghamLogo} alt="Gingham Logo"></img>
                </div>
            </div>
        </>
    )
}

export default Footer;