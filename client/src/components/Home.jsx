import React, { useEffect, useState } from "react";
import { blogTimeConverter } from "../utils/helpers";

function Home() {
    const [blogs, setBlogs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
            fetch("http://127.0.0.1:5555/api/blogs")
                .then(response => response.json())
                .then(data => {
                    const now = new Date();
                    const filteredData = data.filter(blog => new Date(blog.created_at) <= now);
                    const sortedData = filteredData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
            <div className="d-flex-space-between">
                <div className="m-flex-center">
                    <img className='big-logo' src="/site-images/gingham-logo-A_2.svg" alt="Gingham Logo"></img>
                </div>
                <div className="sidebar">
                    <h1 className="font-gingham title-big m-text-center">Gin<span className="kern-8">g</span><span className="kern-2">h</span>am</h1>
                    <br/>
                    <h3> MAKE A POSITIVE IMPACT BY MINIMIZING FOOD WASTE </h3><br/>
                    <p> Do you love fresh, local produce at a great price? Meet Gingham, the platform connecting 
                        you with vendors in farmers markets. <span className="text-500">With Gingham, you can 
                        pre-order mystery baskets filled with surplus or seasonal goods and pick them up directly 
                        at the market.</span>
                    </p>
                    <br/>
                    <p> Our mission: reduce waste, support vendors, and provide fresh, affordable food. Every 
                        basket purchased helps reduce waste and strengthen your community.
                    </p>
                </div>
            </div>
            {currentBlog ?
            <div className="box-blog margin-t-24 badge-container no-float">
                <div className="badge-arrows">
                    <i className="icon-arrow-l margin-r-8" onClick={() => handleNavigate('prev')}>&emsp;&thinsp;</i>
                    <i className="icon-arrow-r" onClick={() => handleNavigate('next')}>&emsp;&thinsp;</i>
                </div>
                <h1>{currentBlog.title}</h1>
                <h6 className="margin-b-8">{blogTimeConverter(currentBlog.created_at)}</h6>
                <div dangerouslySetInnerHTML={{ __html: currentBlog.body }} style={{ width: '100%', height: '100%' }}></div>
            </div>
            : <></>}
            <div className="box-big-blue margin-t-24">
                <h3>HOW DOES GINGHAM WORK?</h3> <br/>
                <p>
                    Vendors build mystery baskets of bundled surplus products that you are able to pre-order and pick-up at a designated time.  
                    <strong> Gingham makes it easy to shop sustainably while supporting your local farmers market community!</strong>
                </p>
                <img src="/site-images/GINGHAM_HOWITWORKS.png" style={{ width: '100%' }} />
            </div>
        </div>
    )
}

export default Home;