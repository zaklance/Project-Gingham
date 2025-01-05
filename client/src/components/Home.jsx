import React, { useEffect, useState } from "react";
import Login from "./user/LoginPopup";


function Home({ isPopup, setIsPopup, handlePopup }) {
    const [blogs, setBlogs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);


    useEffect(() => {
            fetch("http://127.0.0.1:5555/api/blogs")
                .then(response => response.json())
                .then(data => setBlogs(data))
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

    if (blogs.length === 0) return <div>No blogs available.</div>;

    const currentBlog = blogs[currentIndex];


    return (
        <div>
            <div className="m-flex-center">
                <img className='big-logo' src="/site-images/gingham-logo-A_2.svg" alt="Gingham Logo"></img>
            </div>
            <div className="sidebar">
                <h1 className="font-gingham title-big m-text-center">Gin<span className="kern-8">g</span><span className="kern-2">h</span>am</h1>
                <br></br>
                <h3> MAKE A POSITIVE IMPACT BY MINIMIZING FOOD WASTE </h3><br/>
                <p>
                    Do you love to cook? Do you love cheap produce? How about picnics in the park? Well here is the <strong>social impact company</strong> for you: <strong>Gingham</strong>. 
                    Our mission is to minimize food waste by creating a marketplace for vendors in Farmers Market's across the globe. <br/><strong>Rescue good food from going to waste today!</strong>
                </p>
            </div>
            <div className="box-big-blue no-float">
                <h3>HOW DOES GINGHAM WORK?</h3> <br/>
                <p>
                    When vendors at farmers markets approach the end of the day, they want to start git rid of all their product, and sometimes at a cheaper price. 
                    <strong> With Gingham you can browse through vendors and buy discount bundles!</strong>
                </p>
                <img src="/site-images/GINGHAM_HOWITWORKS.png" style={{ width: '100%' }} />
            </div>
            {/* <div className="box-big">
                <img src={farmers} style={{ width: '60%' }}/>
                <img src={blanket} style={{ width: '38%' }}/>
            </div> */}
            <div className="box-blog margin-t-16 badge-container">
                <div className="badge-arrows">
                    <i className="icon-arrow-l margin-r-8" onClick={() => handleNavigate('prev')}>&emsp;&thinsp;</i>
                    <i className="icon-arrow-r" onClick={() => handleNavigate('next')}>&emsp;&thinsp;</i>
                </div>
                <h1>{currentBlog.title}</h1>
                <h6 className="margin-b-8">{currentBlog.created_at}</h6>
                <div dangerouslySetInnerHTML={{ __html: currentBlog.body }} style={{ width: '100%', height: '100%' }}></div>
            </div>
        </div>
    )
}

export default Home;