import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { blogTimeConverter } from '../../utils/helpers';
import { toast } from 'react-toastify';

function ProfileFavorites() {
    const [marketFavs, setMarketFavs] = useState([]);
    const [vendorFavs, setVendorFavs] = useState([]);
    const [blogFavs, setBlogFavs] = useState([]);
    const [openBlog, setOpenBlog] = useState(null);
    const [isClickedMarket, setIsClickedMarket] = useState(false);
    const [isClickedVendor, setIsClickedVendor] = useState(false);
    const [isClickedBlog, setIsClickedBlog] = useState(false);

    const userId = parseInt(globalThis.localStorage.getItem('user_id'))
    const token = localStorage.getItem('user_jwt-token');

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/vendor-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setVendorFavs(data);
            })
            .catch(error => console.error('Error fetching vendor favorites', error));
    }, []);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/market-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setMarketFavs(data);
            })
            .catch(error => console.error('Error fetching market favorites', error));
        }, []);

    useEffect(() => {
        fetch(`http://127.0.0.1:5555/api/blog-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => { setBlogFavs(data) })
            .catch(error => console.error('Error fetching blog favorites', error));
    }, []);

    const handleToggle = (name) => {
        setOpenBlog((prev) => (prev === name ? null : name));
    };

    useEffect(() => {
        if (vendorFavs) {
            const updatedIsClicked = vendorFavs.reduce((acc, fav) => {
                acc[fav.vendor_id] = true;
                return acc;
            }, {});
            setIsClickedVendor(updatedIsClicked);
        }
    }, [vendorFavs, userId]);

    useEffect(() => {
        if (blogFavs) {
            const updatedIsClickedBlog = blogFavs.reduce((acc, fav) => {
                acc[fav.blog_id] = true;
                return acc;
            }, {});
            setIsClickedBlog(updatedIsClickedBlog);
        }
    }, [blogFavs, userId]);

    const handleClickMarket = async (marketId) => {
        setIsClickedMarket((prevState) => ({
            ...prevState,
            [marketId]: !prevState[marketId]
        }));
        if (isClickedMarket[marketId] == false) {
            const response = await fetch('http://127.0.0.1:5555/api/market-favorites', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    market_id: marketId
                })
                // credentials: 'include'
            }).then((resp) => {
                return resp.json()
            }).then(data => {
                setMarketFavs([...marketFavs, data])
                toast.success('Added to favorites!', {
                    autoClose: 2000,
                });
            });
        } else {
            const findFavId = marketFavs.filter(item => item.market_id == marketId)
            for (const item of findFavId) {
                fetch(`http://127.0.0.1:5555/api/market-favorites/${item.id}`, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }).then(() => {
                    setMarketFavs((favs) => favs.filter((fav) => fav.market_id !== marketId));
                    toast.success('Removed from favorites!', {
                        autoClose: 2000,
                    });
                })
            }
        }
    };

    const handleClickVendor = async (vendorId) => {
        setIsClickedVendor((prevState) => ({
            ...prevState,
            [vendorId]: !prevState[vendorId]
        }));
        if (isClickedVendor[vendorId] == false) {
            const response = await fetch('http://127.0.0.1:5555/api/vendor-favorites', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    vendor_id: vendorId
                })
                // credentials: 'include'
            }).then((resp) => {
                return resp.json()
            }).then(data => {
                setVendorFavs([...vendorFavs, data])
                toast.success('Added to favorites!', {
                    autoClose: 2000,
                });
            });
        } else {
            const findFavId = vendorFavs.filter(item => item.vendor_id == vendorId)
            for (const item of findFavId) {
                fetch(`http://127.0.0.1:5555/api/vendor-favorites/${item.id}`, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }).then(() => {
                    setVendorFavs((favs) => favs.filter((fav) => fav.vendor_id !== vendorId));
                    toast.success('Removed from favorites!', {
                        autoClose: 2000,
                    });
                })
            }
        }
    };

    const handleClickBlog = async (blogId) => {
        setIsClickedBlog((prevState) => ({
            ...prevState,
            [blogId]: !prevState[blogId]
        }));
        if (isClickedBlog[blogId] == false) {
            const response = await fetch('http://127.0.0.1:5555/api/blog-favorites', {
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
                fetch(`http://127.0.0.1:5555/api/blog-favorites/${item.id}`, {
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


    return (
        <div className="profile-favorites">
            <h2 className='margin-b-24'>Favorites</h2>
            <h3>Vendors</h3>
            <ul className='favorites-list box-scroll'>
                {vendorFavs.length > 0 ? (
                    vendorFavs.map((data) => (
                        <li key={data.id}>
                            <Link to={`/user/vendors/${data.vendor_id}`}><b>{data.vendor.name}</b> <i>of {data.vendor.city}, {data.vendor.state}</i></Link>
                            <button
                                className={`btn-fav-blog margin-l-8 ${isClickedVendor[data.vendor_id] || vendorFavs.some(fav => fav.vendor_id === data.vendor_id) ? 'btn-fav-blog-on margin-l-8' : ''}`}
                                title="remove vendor from favorites"
                                onClick={(e) => handleClickVendor(data.vendor_id)}>&emsp;
                            </button>
                        </li>
                    ))
                ) : (
                    <p>No favorite vendors</p>
                )}
            </ul>
            <h3 className='margin-t-16'>Markets</h3>
            <ul className='favorites-list box-scroll'>
                {marketFavs.length > 0 ? (
                    marketFavs.map((data) => (
                        <li key={data.id}>
                            <Link to={`/user/markets/${data.market_id}`}><b>{data.market.name}</b> <i>open {data.market.schedule}</i></Link>
                            <button
                                className={`btn-fav-blog margin-l-8 ${isClickedMarket[data.market_id] || marketFavs.some(fav => fav.market_id === data.market_id) ? 'btn-fav-blog-on margin-l-8' : ''}`}
                                title="remove market from favorites"
                                onClick={(e) => handleClickMarket(data.market_id)}>&emsp;
                            </button>
                        </li>
                    ))
                ) : (
                    <p>No favorite markets</p>
                )}
            </ul>
            <h3 className='margin-t-16 margin-b-8'>Blogs</h3>
            <div className='box-scroll'>
                {blogFavs.length > 0 ? (
                    blogFavs.map((blog) => (
                        <details
                            key={blog.id}
                            className='blog-favs'
                            open={openBlog === blog.id}
                            onClick={(e) => {
                                e.preventDefault();
                                handleToggle(blog.id);
                            }}
                        >
                            <summary>
                                {blog?.blog ? `${blogTimeConverter(blog.blog.post_date)}, ${blog.blog.title}` : null}
                                <button
                                    className={`btn-fav-blog margin-l-8 ${isClickedBlog[blog.blog_id] || blogFavs.some(fav => fav.blog_id === blog.blog_id) ? 'btn-fav-blog-on margin-l-8' : ''}`}
                                    title="remove blog from favorites"
                                    onClick={(e) => handleClickBlog(blog.blog_id)}>&emsp;
                                </button>
                            </summary>
                            <div className='badge-container'>
                                <p dangerouslySetInnerHTML={{ __html: blog?.blog?.body }} style={{ width: '100%', height: '100%' }}></p>
                            </div>
                        </details>
                    ))
                ) : (
                    <p>No favorite blogs</p>
                )}
            </div>
        </div>
    )
}

export default ProfileFavorites