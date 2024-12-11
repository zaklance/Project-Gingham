import React, { createContext, useState } from "react";
import { useOutletContext } from "react-router-dom";


function Home() {
    const { handlePopup } = useOutletContext();

    return (
        <div>
            <div className="vendor-portal-background">
                {/* <img className='big-logo' src="/site-images/gingham-logo-2.svg" alt="Gingham Logo"></img> */}
                <div className="sidebar">
                    <br />
                    <br />
                    <br />
                    <div className='box-portal-home'>
                        <h1 className="font-gingham title-big text-center">Gingham</h1>
                        <br/>
                        <p>WELCOME CURRENT AND FUTURE VENDORS!</p>
                    </div>
                    <br/>
                    <br/>
                    <h2 className="box-portal-home">Sell Surplus Product instead of putting it to waste!</h2>
                </div>
                <div className="box-inside">
                    <h3 className="margin-b-16">Why Partner with Gingham?</h3>
                    <p>
                        As a Gingham vendor, you can easily sell surplus or "imperfect" products to local consumers, 
                        boost your revenue, and contribute to reducing food waste. Our platform connects you with 
                        eco-conscious buyers while making it simple to manage your sales and fulfillment.
                    </p>
                </div>
                <div className="box-inside">
                    <h3 className="margin-b-16">How Gingham Works:</h3>
                    <p>
                        <strong>
                            Build mystery baskets of bundled surplus products you'd like to sell quickly. With Gingham, 
                            you can easily list discount bundles of your unsold items for consumers to pre-order then pick-up.
                        </strong>
                    </p>
                    <br/>
                    <img src="/site-images/GINGHAM_VENDOR_HOWITWORKS.png" style={{ width: '100%' }} />
                    <p><strong>Sign up:</strong> Get started quickly with an easy registration and signup process.</p>
                    <p><strong>List your Baskets:</strong> Set up bundles of items you want to sell at a discount.</p>
                    <p><strong>Consumers Buy and Pick Up:</strong> Shoppers browse and purchase bundles and pickup at a designated time before market close.</p>
                </div>
                <div className="box-inside">
                    <h3 className="margin-b-16">Why Choose Gingham?</h3>
                    {/* Build Graphics and diagrams a la "Gingham How it Works"*/}
                    <p><strong>Increase and Boost Sales:</strong> Sell surplus products you may otherwise throw away.</p>
                    <p><strong>Help the Environment:</strong> Play a crucial role in reducing food waste.</p>
                    <p><strong>Reach New Customers:</strong> Connect with a growing community focused on sustainability and local food sources.</p>
                    <div className='flex-center'>
                        <img src="/site-images/GINGHAM_VENDOR_FARMERSMARKET.png" style={{ width: '60%' }} />
                    </div>

                    <h3 className="margin-b-16 margin-t-24">Support Local Communities</h3>
                    <p>
                        By selling with Gingham, you're not only reducing food waste but also supporting local 
                        communities and economies. <strong>Join us in making a positive impact!</strong>
                    </p>
                    <h3 className="box-portal-home margin-t-24 blue">Interested in becoming a vendor? <a className="link-underline" onClick={handlePopup}> Sign up here!</a></h3>
                </div>
                <br/>
            </div>
        </div>
    )
}

export default Home;