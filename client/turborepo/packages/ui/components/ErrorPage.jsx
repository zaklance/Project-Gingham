import React from 'react';
import { useRouteError } from "react-router-dom";
import '../assets/css/index.css';

function ErrorPage() {
    const error = useRouteError();
    return(
        <div className='wrapper-error'>
            <title>gingham • Error</title>
            <h1>ERROR. PAGE DOESN'T EXIST.</h1>
        </div>
    )
}

export default ErrorPage;