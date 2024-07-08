import React from "react";
import ginghamLogo from '../assets/images/gingham-4-alt_1200px.png';
import farmers from '../assets/images/22bitman.xlarge1.jpg';

function Home() {
    return (
        <div className="wrapper">
            <img className='big-logo' src={ginghamLogo} alt="Gingham Logo"></img>
            <div className="sidebar">
                <h1>Project Gingham</h1>
                <br></br>
                <p>
                    Do you love to cook? Do you love cheap produce? How about picnics in the park? Well here is the startup for you: Gingham. When vendors at farmers markets approach the end of the day, they want to start git rid of all their product, and sometimes at a cheaper price. With Gingham you can browse through vendors and buy discount bundles!
                </p>
                <br></br>
                <h4> GET A FREE GINGHAM PICNIC BLANKET AFTER SIGN UP! </h4>
                <p> **NEW CUSTOMERS ONLY** </p>
            </div>
            <div className="box-big">
                <img src={farmers}/>
            </div>
        </div>
    )
}

export default Home;