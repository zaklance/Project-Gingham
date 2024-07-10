import React from 'react';
import { useRouteError, Link } from "react-router-dom";
import '../assets/css/index.css';
import NavBar from './NavBar';

function ErrorPage() {
    const error = useRouteError();
    return(
        <div className='wrapper'>
            <h1>ERROR. PAGE DOESN'T EXIST.</h1>
        </div>
    )
}

export default ErrorPage;