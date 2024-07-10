import React from "react";
import ginghamLogo from '../assets/images/gingham-4-alt_1200px.png';
import farmers from '../assets/images/22bitman.xlarge1.jpg';
import howitworks from '../assets/images/GINGHAM_HOWITWORKS_cropped-alt.png';
import blanket from '../assets/images/GINGHAM_PICNICBLANKET.png';

function Home() {
    return (
        <div className="wrapper">
            <img className='big-logo' src={ginghamLogo} alt="Gingham Logo"></img>
            <div className="sidebar">
                <h1>Project Gingham</h1>
                <br></br>
                <h3> MAKE A POSITIVE IMPACT BY MINIMIZING FOOD WASTE </h3><br/>
                <p>
                    Do you love to cook? Do you love cheap produce? How about picnics in the park? Well here is the <strong>social impact company</strong> for you: <strong>Gingham</strong>. 
                    Our mission is to minimize food waste by creating a marketplace for vendors in Farmers Market's across the globe. <br/><strong>Rescue good food from going to waste today!</strong>
                </p>
            </div>
            <div className="box-big-blue">
                <h3>HOW DOES GINGHAM WORK?</h3> <br/>
                <p>
                    When vendors at farmers markets approach the end of the day, they want to start git rid of all their product, and sometimes at a cheaper price. 
                    <strong> With Gingham you can browse through vendors and buy discount bundles!</strong>
                </p>
                <img src={howitworks} style={{ width: '100%' }} />
            </div>
            <div className="box-big">
                <img src={farmers} style={{ width: '60%' }}/>
                <img src={blanket} style={{ width: '38%' }}/>
            </div>
        </div>
    )
}

export default Home;