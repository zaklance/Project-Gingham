import React from "react";
import ginghamLogo from '../assets/images/gingham-4-alt_1200px.png';

function Home() {
    return (
        <div className="wrapper">
            <img src={ginghamLogo} alt="Gingham Logo" style={{ width: '300px' }}></img>
            <h1>Project Gingham</h1>
            <p className="sidebar">
                DO you love to cook? Do you love cheap produce? How about picnics in the park? Well here is the startup for you: Gingham. When vendors at farmers markets approach the end of the day, they want to start git rid of all their product, and sometimes at a cheaper price. With Gingham you can browse through vendors and buy discount bundles!
            </p>
            <h3> GET A FREE GINGHAM PICNIC BLANKET AFTER SIGN UP! </h3>
            <p> **NEW CUSTOMERS ONLY** </p>
        </div>
    )
}

export default Home;