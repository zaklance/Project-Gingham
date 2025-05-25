import React, { createContext, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { blogTimeConverter } from "../../utils/helpers";


function Home() {
    const [blogs, setBlogs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const { handlePopup } = useOutletContext();

    useEffect(() => {
        const anchor = window.location.hash.slice(1);
        setTimeout(() => {
            if (anchor) {
                const anchorEl = document.getElementById(anchor);
                if (anchorEl) {
                    anchorEl.scrollIntoView();
                }
            }
        }, 500);
    }, []);
    
    useEffect(() => {
        fetch("/api/blogs?for_vendor=true")
            .then(response => response.json())
            .then(data => {
                const now = new Date();
                const filteredData = data.filter(blog => new Date(blog.post_date) <= now);
                const sortedData = filteredData.sort((a, b) => new Date(b.post_date) - new Date(a.post_date));
                setBlogs(sortedData);
            })
            .catch(error => console.error('Error fetching blogs', error));
    }, []);

    const handleNavigate = (direction) => {
        setCurrentIndex((prevIndex) => {
            if (direction === 'prev') {
                return prevIndex > 0 ? prevIndex - 1 : prevIndex; // Prevent moving past index 0
            } else if (direction === 'next') {
                return prevIndex < blogs.length - 1 ? prevIndex + 1 : prevIndex; // Prevent moving past last index
            }
            return prevIndex;
        });
    };

    const currentBlog = blogs[currentIndex];

    return (
        <div>
            <div className="vendor-portal-background m-margin-0">
                <title>Gingham • Vendor Portal</title>
                {/* <img className='big-logo' src="/site-images/gingham-logo_04-2A-alt.svg" alt="Gingham Logo"></img> */}
                <div className="sidebar">
                    <br className="m-hidden"/>
                    <br className="m-hidden"/>
                    <br/>
                    <div className='box-portal-home text-center text-blend-lighten'>
                        <h1 className="font-cera title-big text-center text-900">gingham</h1>
                        <br/>
                        <p>WELCOME CURRENT AND FUTURE VENDORS!</p>
                    </div>
                    <br className="m-hidden"/>
                    <br/>
                    <h2 className="box-portal-home text-blend-lighten">Sell Surplus Product Instead of Putting it to Waste!</h2>
                </div>
                {currentBlog ? (
                    <div id='blog' className="box-blog margin-t-48 margin-l-48 margin-r-48 badge-container no-float" style={{borderRadius: "20px"}}>
                        <div className="badge-arrows">
                            <i className="icon-arrow-l-fff margin-r-8" onClick={() => handleNavigate('prev')}>&emsp;&thinsp;</i>
                            <i className="icon-arrow-r-fff" onClick={() => handleNavigate('next')}>&emsp;&thinsp;</i>
                        </div>
                        <h1>{currentBlog.type === 'General' ? null : `${currentBlog.type}: `}{currentBlog.title}</h1>
                        <h6 className="margin-b-8">{blogTimeConverter(currentBlog.post_date)}</h6>
                        <div dangerouslySetInnerHTML={{ __html: currentBlog.body }} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                ) : <></>}
                <div className="box-inside">
                    <h3 className="margin-b-16">Why Partner with <span className="text-900">GINGHAM</span>?</h3>
                    <p>
                        As a <span className="font-cera text-900">gingham</span> vendor, you can easily sell surplus or "imperfect" products to local consumers, 
                        boost your revenue, and contribute to reducing food waste. Our platform connects you with 
                        eco-conscious buyers while making it simple to manage your sales and fulfillment.
                    </p>
                </div>
                <div className="box-inside">
                    <h3 className="margin-b-16">How <span className="text-900">GINGHAM</span> Works:</h3>
                    <p>
                        <strong>
                            Build mystery baskets of bundled surplus products you'd like to sell quickly. With <span className="font-cera text-900">gingham</span>, 
                            you can easily list discount bundles of your unsold items for consumers to pre-order then pick-up.
                        </strong>
                    </p>
                    <br/>
                    <img className="width-100" src="/site-images/GINGHAM_VENDOR_HOWITWORKS_CERA_1800px.png"/>
                    <p><strong>Sign up:</strong> Get started quickly with an easy registration and signup process.</p>
                    <p><strong>List your Baskets:</strong> Set up bundles of items you want to sell at a discount.</p>
                    <p><strong>Consumers Buy and Pick Up:</strong> Shoppers browse and purchase bundles and pickup at a designated time before market close.</p>
                </div>
                <div className="box-inside">
                    <h3 className="margin-b-16">Why Choose <span className="text-900">GINGHAM</span>?</h3>
                    {/* Build Graphics and diagrams a la "Gingham How it Works"*/}
                    <p><strong>Increase and Boost Sales:</strong> Sell surplus products you may otherwise throw away.</p>
                    <p><strong>Help the Environment:</strong> Play a crucial role in reducing food waste.</p>
                    <p><strong>Reach New Customers:</strong> Connect with a growing community focused on sustainability and local food sources.</p>
                    <div className='flex-center'>
                        <img className="width-60" src="/site-images/GINGHAM_VENDOR_FARMERSMARKET_1800px.png"/>
                    </div>

                    <h3 className="margin-b-16 margin-t-24">Support Local Communities</h3>
                    <p>
                        By selling with Gingham, you're not only reducing food waste but also supporting local 
                        communities and economies. <strong>Join us in making a positive impact!</strong>
                    </p>
                    <h3 className="box-portal-home margin-t-24 blue">Interested in becoming a vendor? <a className="link-underline-inverse" onClick={handlePopup}> Sign up here!</a></h3>
                </div>
                <br/>
            </div>
        </div>
    )
}

export default Home;