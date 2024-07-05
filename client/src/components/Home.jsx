import React from "react";
import ginghamLogo from '../assets/images/gingham-2_1200px.png';

function Home() {
    return (
        <div style={{ textAlign: 'center' }}>
            <br/>
            <img src={ginghamLogo} alt="Gingham Logo" style={{ width: '300px' }}></img>
            <br/>
            <h1>Project Gingham</h1>
            <h3> GET A FREE GINGHAM PICNIC BLANKET AFTER SIGN UP! </h3>
            <p> **NEW CUSTOMERS ONLY** </p>
        </div>
    )
}

export default Home;