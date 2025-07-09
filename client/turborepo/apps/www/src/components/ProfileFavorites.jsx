import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { blogTimeConverter } from "@repo/ui/helpers.js";
import { toast } from 'react-toastify';

function ProfileFavorites() {
    const [marketFavs, setMarketFavs] = useState([]);
    const [vendorFavs, setVendorFavs] = useState([]);
    const [recipeFavs, setRecipeFavs] = useState([]);
    const [blogFavs, setBlogFavs] = useState([]);
    const [openBlog, setOpenBlog] = useState(null);
    const [isClickedMarket, setIsClickedMarket] = useState(false);
    const [isClickedVendor, setIsClickedVendor] = useState(false);
    const [isClickedRecipe, setIsClickedRecipe] = useState(false);
    const [isClickedBlog, setIsClickedBlog] = useState(false);
    const [openFolder, setOpenFolder] = useState({});

    const userId = parseInt(globalThis.localStorage.getItem('user_id'))
    const token = localStorage.getItem('user_jwt-token');

    useEffect(() => {
        fetch(`/api/vendor-favorites?user_id=${userId}`, {
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
        fetch(`/api/market-favorites?user_id=${userId}`, {
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
        fetch(`/api/recipe-favorites?user_id=${userId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setRecipeFavs(data);
            })
            .catch(error => console.error('Error fetching recipe favorites', error));
        }, []);

    useEffect(() => {
        fetch(`/api/blog-favorites?user_id=${userId}`, {
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

    const handleToggleBlog = (name) => {
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
        if (recipeFavs) {
            const updatedIsClicked = recipeFavs.reduce((acc, fav) => {
                acc[fav.recipe_id] = true;
                return acc;
            }, {});
            setIsClickedRecipe(updatedIsClicked);
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
            const response = await fetch('/api/market-favorites', {
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
                fetch(`/api/market-favorites/${item.id}`, {
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
            const response = await fetch('/api/vendor-favorites', {
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
                fetch(`/api/vendor-favorites/${item.id}`, {
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
    
    const handleClickRecipe = async (recipeId) => {
        setIsClickedVendor((prevState) => ({
            ...prevState,
            [recipeId]: !prevState[recipeId]
        }));
        if (isClickedRecipe[recipeId] == false) {
            const response = await fetch('/api/recipe-favorites', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    recipe_id: recipeId
                })
                // credentials: 'include'
            }).then((resp) => {
                return resp.json()
            }).then(data => {
                setRecipeFavs([...recipeFavs, data])
                toast.success('Added to favorites!', {
                    autoClose: 2000,
                });
            });
        } else {
            const findFavId = recipeFavs.filter(item => item.recipe_id == recipeId)
            for (const item of findFavId) {
                fetch(`/api/recipe-favorites/${item.id}`, {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }).then(() => {
                    setRecipeFavs((favs) => favs.filter((fav) => fav.recipe_id !== recipeId));
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

    const handleToggle = (name) => {
        setOpenFolder((prev) => (prev === name ? null : name));
    };


    return (
        <div className="profile-favorites">
            <h2 className='margin-b-24'>Favorites</h2>
            <details
                className='details-images'
                open={openFolder === 'vendors'}
            >
                <summary onClick={(e) => {
                    e.preventDefault();
                    handleToggle('vendors');
                }}>
                    Vendors
                </summary>
                <ul className='favorites-list box-scroll'>
                    {vendorFavs.length > 0 && (
                        [...vendorFavs]
                        .sort((a, b) => a.vendor.name.localeCompare(b.vendor.name))
                            .map((data) => (
                                <li key={data.id}>
                                    <Link to={`/vendors/${data.vendor_id}`}><b>{data.vendor.name}</b> <i>of {data.vendor.city}, {data.vendor.state}</i></Link>
                                    <button
                                        className={`btn-fav-blog margin-l-8 ${isClickedVendor[data.vendor_id] || vendorFavs.some(fav => fav.vendor_id === data.vendor_id) ? 'btn-fav-blog-on margin-l-8' : ''}`}
                                        title="remove vendor from favorites"
                                        onClick={(e) => handleClickVendor(data.vendor_id)}>&emsp;
                                    </button>
                                </li>
                            ))
                    )}
                </ul>
            </details>
            <details
                className='details-images'
                open={openFolder === 'markets'}
            >
                <summary onClick={(e) => {
                    e.preventDefault();
                    handleToggle('markets');
                }}>
                    Markets
                </summary>
                <ul className='favorites-list box-scroll'>
                    {marketFavs.length > 0 && (
                        [...marketFavs]
                            .sort((a, b) => a.market.name.localeCompare(b.market.name))
                            .map((data) => (
                                <li key={data.id}>
                                    <Link to={`/markets/${data.market_id}`}><b>{data.market.name}</b> <i>open {data.market.schedule}</i></Link>
                                    <button
                                        className={`btn-fav-blog margin-l-8 ${isClickedMarket[data.market_id] || marketFavs.some(fav => fav.market_id === data.market_id) ? 'btn-fav-blog-on margin-l-8' : ''}`}
                                        title="remove market from favorites"
                                        onClick={(e) => handleClickMarket(data.market_id)}>&emsp;
                                    </button>
                                </li>
                            ))
                    )}
                </ul>
            </details>
            <details
                className='details-images'
                open={openFolder === 'recipes'}
            >
                <summary onClick={(e) => {
                    e.preventDefault();
                    handleToggle('recipes');
                }}>
                    Recipes
                </summary>
                <ul className='favorites-list box-scroll'>
                    {recipeFavs.length > 0 && (
                        [...recipeFavs]
                            .sort((a, b) => a.recipe.title.localeCompare(b.recipe.title))
                            .map((data) => (
                                <li key={data.id}>
                                    <Link to={`/recipe/${data.recipe_id}`}><b>{data.recipe.title}</b> <i>by {data.recipe.author}</i></Link>
                                    <button
                                        className={`btn-fav-blog margin-l-8 ${isClickedRecipe[data.recipe_id] || recipeFavs.some(fav => fav.recipe_id === data.recipe_id) ? 'btn-fav-blog-on margin-l-8' : ''}`}
                                        title="remove recipe from favorites"
                                        onClick={(e) => handleClickRecipe(data.recipe_id)}>&emsp;
                                    </button>
                                </li>
                            ))
                    )}
                </ul>
            </details>
            {blogFavs.length > 0 && (
                <details
                    className='details-images'
                    open={openFolder === 'blogs'}
                >
                    <summary onClick={(e) => {
                        e.preventDefault();
                        handleToggle('blogs');
                    }}>
                        Blogs
                    </summary>
                    <ul className='favorites-list-blog'>
                        {blogFavs.length > 0 && (
                            [...blogFavs]
                                .sort((a, b) => new Date(b.blog.post_date) - new Date(a.blog.post_date))
                                .map((blog) => (
                                <details
                                    key={blog.id}
                                    className='blog-favs'
                                    open={openBlog === blog.id}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleToggleBlog(blog.id);
                                    }}
                                >
                                    <summary>
                                        {blog?.blog ? `${blog.blog.type === 'General' ? '' : ` ${blog.blog.type}: `} ${blog.blog.title}, ${blogTimeConverter(blog.blog.post_date)}` : null}
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
                        )}
                    </ul>
                </details>
            )}
        </div>
    )
}

export default ProfileFavorites