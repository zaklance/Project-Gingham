import React, { useEffect, useState } from "react";
import { useOutletContext } from 'react-router-dom';
import { blogTimeConverter } from "../utils/helpers";
import { toast } from 'react-toastify';

function Home() {
    const [blogs, setBlogs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isClicked, setIsClicked] = useState(false);
    const [blogFavs, setBlogFavs] = useState([]);
    const [bgIndex, setBgIndex] = useState(0);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'));
    const token = localStorage.getItem('user_jwt-token');

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
            fetch("/api/blogs?for_user=true")
                .then(response => response.json())
                .then(data => {
                    const now = new Date();
                    const filteredData = data.filter(blog => new Date(blog.post_date) <= now);
                    const sortedData = filteredData.sort((a, b) => new Date(b.post_date) - new Date(a.post_date));
                    setBlogs(sortedData);
                })
                .catch(error => console.error('Error fetching blogs', error));
        }, []);

    useEffect(() => {
        if (userId) {
            fetch(`/api/blog-favorites?user_id=${userId}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
                .then(response => response.json())
                .then(data => { setBlogFavs(data) })
                .catch(error => console.error('Error fetching blog favorites', error));
        }
    }, [userId]);
    
    useEffect(() => {
        if (blogs) {
            const updatedIsClicked = blogs.reduce((acc, blog) => {
                acc[blog.id] = blogFavs.some(fav => fav.blog_id === blog.id);
                return acc;
            }, {});
            setIsClicked(updatedIsClicked);
        }
    }, [blogs, blogFavs, userId]);

    const handleClick = async (blogId) => {
        if (!userId) {
            handlePopup()
            return
        }
        setIsClicked((prevState) => ({
            ...prevState,
            [blogId]: !prevState[blogId]
        }));
        if (isClicked[blogId] == false) {
            const response = await fetch('/api/blog-favorites', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    blog_id: blogId
                })
                // credentials: 'include'
            }).then((resp) => {
                return resp.json()
            }).then(data => {
                setBlogFavs([...blogFavs, data])
                toast.success('Added to favorites!', {
                    autoClose: 2000,
                });
            });
        } else {
            const findBlogFavId = blogFavs.filter(item => item.blog_id == blogId)
            for (const item of findBlogFavId) {
                fetch(`/api/blog-favorites/${item.id}`, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }).then(() => {
                    setBlogFavs((favs) => favs.filter((fav) => fav.blog_id !== blogId));
                    toast.success('Removed from favorites!', {
                        autoClose: 2000,
                    });
                })
            }
        }
    };

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

    const backgroundImages =[
        './site-images/LzYeux_120719_0032_1800px.jpg',
        './site-images/LzYeux_120719_0033_1800px.jpg',
        './site-images/LzYeux_120719_0036_1800px.jpg'
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex(prev => (prev + 1) % backgroundImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);
    

    return (
        <div>
            <title>Gingham • Home</title>
            <div className="user-portal-background" style={{ backgroundImage: `url(${backgroundImages[bgIndex]})` }}>
                <br className="d-br"/>
                <br className="d-br" />
                <br/>
                <div className="box-portal-home text-blend-lighten text-center">
                    <h1 className=" font-gingham title-big-gingham padding-b-32">Gin<span className="kern-8">g</span><span className="kern-2">h</span>am</h1>
                </div>
                <br className="m-br"/>
                <div className="box-home box-inside">
                    <h2 className="text-transparent">Make A Positive Impact By Minimizing Food Waste </h2><br/>
                    <p> Do you love fresh, local produce at a great price? Meet Gingham, the platform connecting 
                        you with vendors in farmers markets. <span className="text-500">With Gingham, you can 
                        pre-order mystery baskets filled with surplus or seasonal goods and pick them up directly 
                        at the market.</span>
                    </p>
                    <br/>
                    <p> Our mission: reduce waste, support vendors, and provide fresh, affordable food. Every 
                        basket purchased helps reduce waste and strengthen your community. &emsp;
                        <br className="m-br"/>
                        <br className="m-br"/>
                        <span>
                            {!token && (
                                <a className="link-underline-inverse text-600" onClick={handlePopup}> Sign up here!</a>
                            )}
                        </span>
                    </p>
                </div>
            </div>
            {currentBlog ? (
                <div className="box-blog margin-t-24 badge-container no-float" id="blog">
                    <div className="badge-arrows">
                        <i className="icon-arrow-l margin-r-8" onClick={() => handleNavigate('prev')}>&emsp;&thinsp;</i>
                        <i className="icon-arrow-r" onClick={() => handleNavigate('next')}>&emsp;&thinsp;</i>
                        <button
                            className={`btn-fav-blog margin-l-8 ${isClicked[currentBlog.id] || blogFavs.some(fav => fav.blog_id === currentBlog.id) ? 'btn-fav-blog-on margin-l-8' : ''}`}
                            title={isClicked[currentBlog.id] || blogFavs.some(fav => fav.blog_id === currentBlog.id) ? 'remove blog from favorites' : 'save blog as favorite'}
                            onClick={(e) => handleClick(currentBlog.id)}>&emsp;
                        </button>
                    </div>
                    <h1>{currentBlog.type === 'General' ? null : `${currentBlog.type}: `}{currentBlog.title}</h1>
                    <h6 className="margin-b-8">{blogTimeConverter(currentBlog.post_date)}</h6>
                    <div dangerouslySetInnerHTML={{ __html: currentBlog.body }} style={{ width: '100%', height: '100%' }}></div>
                </div>
            ) : <></>}
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