import React, { useEffect, useRef, useState } from 'react';
import { blogTimeConverter } from '../../utils/helpers';
import { toast } from 'react-toastify';

const AdminBlogVendor = ({ blogs, activeTabMode }) => {
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');
    const [blogsFor, setBlogsFor] = useState([]);
    const [newBlogType, setNewBlogType] = useState('General');
    const [tempBlogData, setTempBlogData] = useState(null);
    const [editingBlogId, setEditingBlogId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [newBlog, setNewBlog] = useState(`
        <div class="column-3">
            <article class="first-letter">
                Do you love supporting local farmers, enjoying fresh produce, and finding great 
                deals? Meet Gingham, the innovative platform that connects you with discounted 
                baskets from farmers market vendors while helping reduce food waste.
            </article>
            <article>
                Here’s how it works: Farmers market vendors often have surplus items at the end 
                of the day. With Gingham, they bundle these items into discounted baskets for you 
                to browse, reserve, and pick up at your convenience. Think of it as your personal 
                gateway to fresh, local, and sustainable food.
            </article>
            <article>
                Gingham isn’t just about savings—it’s about creating a positive impact. By 
                purchasing a basket, you’re rescuing perfectly good food from going to waste, 
                supporting local businesses, and embracing a more sustainable way of living. Plus, 
                with fresh ingredients at your fingertips, you can enjoy cooking, meal prep, or 
                even a spontaneous picnic with ease.
            </article>
            <article>
                Signing up is quick and simple. Join the Gingham community today to start saving, 
                reducing waste, and supporting your local farmers markets. Together, we can create 
                a more sustainable future—one basket at a time!
            </article>
            <article>
                —The Gingham Team
            </article>
            <img class="img-blog" src="/site-images/GINGHAM_VENDOR_FARMERSMARKET.png" alt="logo" />
        </div>
    `);

    const textareasRefAdd = useRef([]);
    const textareasRefEdit = useRef([]);
    const adminId = parseInt(globalThis.localStorage.getItem('admin_user_id'));

    useEffect(() => {
        const filteredBlogs = blogs.filter(blog => blog.for_vendor === true);
        setBlogsFor(filteredBlogs);
    }, [blogs]);

    const postBlog = async () => {
        if (!newTitle) {
            return (toast.warning('No blog title.', {
                autoClose: 4000,
            }))
        }
        if (!newDate) {
            return (toast.warning('No blog date', {
                autoClose: 4000,
            }))
        }

        if (confirm(`Are you sure you want to post the blog "${newTitle}" to the site?`)) {
            try {
                const postedAt = newDate;
                const response = await fetch('/api/blogs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: newBlogType,
                        title: newTitle,
                        body: newBlog,
                        for_user: false,
                        for_vendor: true,
                        for_admin: false,
                        post_date: postedAt,
                        admin_user_id: adminId,
                    }),
                });
                const result = await response.json();
                if (response.ok) {
                    toast.success('Blog posted successfully!', {
                        autoClose: 4000,
                    });
                    // console.log(result);
                } else {
                    toast.error('Error posting blog', result.error, {
                        autoClose: 4000,
                    });
                }
            } catch (error) {
                console.error('Error sending blog:', error);
            }
        }
    };

    useEffect(() => {
        textareasRefAdd.current.forEach((textarea) => {
            if (textarea) {
                textarea.addEventListener('keydown', handleTabKey);
            }
        });

        return () => {
            textareasRefAdd.current.forEach((textarea) => {
                if (textarea) {
                    textarea.removeEventListener('keydown', handleTabKey);
                }
            });
        };
    }, []);

    const handleTabKey = (e) => {
        // if (e.key === 'Tab' && e.shiftKey) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;

            e.target.value =
                e.target.value.substring(0, start) +
                '\t' +
                e.target.value.substring(end);

            e.target.selectionStart = e.target.selectionEnd = start + 1;
        }
    };

    const handleBlogUpdate = async (blogId) => {
        try {
            const formattedData = {
                ...tempBlogData,
                post_date: tempBlogData.post_date ? tempBlogData.post_date.split(" ")[0] : "",
            };
            
            const response = await fetch(`/api/blogs/${blogId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData),
            });

            if (response.ok) {
                const updatedBlog = await response.json();
                setBlogsFor((prev) =>
                    prev.map((item) => (item.id === blogId ? updatedBlog : item))
                );
                setEditingBlogId(null);
                console.log('Blog updated successfully:', updatedBlog);
            } else {
                console.error('Failed to update blog:', await response.text());
            }
        } catch (error) {
            console.error('Error updating blog:', error);
        }
    };

    const handleBlogDelete = async (id) => {
        if (confirm(`Are you sure you want to delete this Blog?`)) {
            try {

                fetch(`/api/blogs/${id}`, {
                    method: "DELETE",
                }).then(() => {
                    setBlogsFor((prev) => prev.filter((item) => item.id !== id))
                })
            } catch (error) {
                console.error("Error deleting blog", error)
            }
        }
    }
    
        const handleBlogEditToggle = (id, title, body, post_date, type, for_user, for_vendor, for_admin) => {
            setEditingBlogId(id);
            setTempBlogData({
                title,
                body,
                post_date: post_date ? post_date.split(" ")[0] : "",
                type,
                for_user,
                for_vendor,
                for_admin
            });
        };

    const handleEditInputChange = (event) => {
        const { name, value } = event.target;
        setTempBlogData((prev) => ({
            ...prev,
            [name]: name === "post_date" ? value : value,
        }));
    };

    const handleNavigate = (direction) => {
        setCurrentIndex((prevIndex) => {
            if (direction === 'prev') {
                return prevIndex > 0 ? prevIndex - 1 : prevIndex; // Prevent moving past index 0
            } else if (direction === 'next') {
                return prevIndex < blogsFor.length - 1 ? prevIndex + 1 : prevIndex; // Prevent moving past last index
            }
            return prevIndex;
        });
    };

    const currentBlog = blogsFor[currentIndex];


    return (
        <>
            {activeTabMode === 'add' && (
                <>
                    <h2 className='margin-b-16'>Add Vendor Blog</h2>
                    <div className='box-bounding'>
                        <div className='form-group'>
                            <label>Blog Type:</label>
                            <select
                                name="blog_type"
                                value={newBlogType}
                                onChange={(e) => setNewBlogType(e.target.value)}
                            >
                                <option value='General'>General</option>
                                <option value='Recipe'>Recipe</option>
                                <option value='Market Spotlight'>Spotlight Market</option>
                                <option value='Vendor Spotlight'>Spotlight Vendor</option>
                            </select>
                        </div>
                        <div className='form-group'>
                            <label>Title:</label>
                            <input
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Witty Newsletter Title"
                            />
                        </div>
                        <div className='form-group'>
                            <label>Post Date:</label>
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                            />
                        </div>
                        <div className='form-group'>
                            <label>Body HTML:</label>
                            <textarea
                                id="html-input"
                                value={newBlog}
                                onChange={(e) => setNewBlog(e.target.value)}
                                placeholder="Type something..."
                                ref={(el) => (textareasRefAdd.current[0] = el)}
                            />
                        </div>
                        <div className='flex-start'>
                            <button className='btn btn-small margin-t-8 margin-l-16 margin-b-16' onClick={postBlog}>Post Blog</button>
                        </div>
                    </div>
                    <div className="box-blog margin-t-16 badge-container">
                        <div className="badge-arrows">
                            <i className="icon-arrow-l margin-r-8">&emsp;&thinsp;</i>
                            <i className="icon-arrow-r">&emsp;&thinsp;</i>
                            <button
                                className='btn-fav-blog btn-fav-blog-on margin-l-8'
                                title='save blog as favorite'
                            >&emsp;
                            </button>
                        </div>
                        <h1>{newBlogType === 'General' ? null : `${newBlogType}: `}{newTitle}</h1>
                        <h6 className="margin-b-8">{newDate ? blogTimeConverter(newDate) : ''}</h6>
                        <div dangerouslySetInnerHTML={{ __html: newBlog }} style={{ width: '100%', height: '100%'}}></div>
                    </div>
                </>
            )}
            {activeTabMode === 'edit' && blogsFor.length > 0 && (
                <>
                    <div>
                        <h2>Edit Vendor Blog</h2>
                        <div className='flex-wrap'>
                            <div>
                                {editingBlogId === currentBlog.id ? (
                                    <>
                                        <div className='box-bounding'>
                                            <div className='form-group'>
                                                <label>Title:</label>
                                                <input
                                                    name="title"
                                                    value={tempBlogData.title}
                                                    onChange={handleEditInputChange}
                                                    placeholder="Witty Newsletter Title"
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label>Type:</label>
                                                <select
                                                    name="type"
                                                    value={tempBlogData?.type}
                                                    onChange={handleEditInputChange}
                                                >
                                                    <option value='General'>General</option>
                                                    <option value='Recipe'>Recipe</option>
                                                    <option value='Market Spotlight'>Spotlight Market</option>
                                                    <option value='Vendor Spotlight'>Spotlight Vendor</option>
                                                </select>
                                            </div>
                                            <div className='form-group'>
                                                <label>Post Date:</label>
                                                <input
                                                    type="date"
                                                    name="post_date"
                                                    value={tempBlogData.post_date ? tempBlogData.post_date.split(" ")[0] : ""}
                                                    onChange={handleEditInputChange}
                                                />
                                            </div>
                                            <div className='form-group'>
                                                <label>Body HTML:</label>
                                                <textarea
                                                    id="html-input"
                                                    name="body"
                                                    value={tempBlogData.body}
                                                    placeholder="Type something..."
                                                    onChange={handleEditInputChange}
                                                    onKeyDown={handleTabKey}
                                                    ref={(el) => (textareasRefEdit.current[0] = el)}
                                                />
                                            </div>
                                            <button className='btn btn-small margin-t-24 margin-r-8' onClick={() => handleBlogUpdate(currentBlog.id)}>Save</button>
                                            <button className='btn btn-small btn-gap' onClick={() => setEditingBlogId(null)}>Cancel</button>
                                        </div>
                                        <div className="box-blog margin-t-16 badge-container">
                                            <div className="badge-arrows">
                                                <i className="icon-arrow-l margin-r-8">&emsp;&thinsp;</i>
                                                <i className="icon-arrow-r">&emsp;&thinsp;</i>
                                                <button
                                                    className='btn-fav-blog btn-fav-blog-on margin-l-8'
                                                    title='save blog as favorite'
                                                >&emsp;
                                                </button>
                                            </div>
                                            <h1>{tempBlogData.type === 'General' ? null : `${tempBlogData.type}: `}{tempBlogData.title}</h1>
                                            <h6 className="margin-b-8">{blogTimeConverter(tempBlogData.post_date)}</h6>
                                            <div dangerouslySetInnerHTML={{ __html: tempBlogData.body }} style={{ width: '100%', height: '100%' }}></div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="box-blog margin-t-16 badge-container">
                                            <div className="badge-arrows">
                                                <i className="icon-arrow-l margin-r-8" onClick={() => handleNavigate('prev')}>&emsp;&thinsp;</i>
                                                <i className="icon-arrow-r" onClick={() => handleNavigate('next')}>&emsp;&thinsp;</i>
                                                <button
                                                    className='btn-fav-blog btn-fav-blog-on margin-l-8'
                                                    title='save blog as favorite'
                                                >&emsp;
                                                </button>
                                            </div>
                                            <h1>{currentBlog.type === 'General' ? null : `${currentBlog.type}: `}{currentBlog.title}</h1>
                                            <h6 className="margin-b-8">{blogTimeConverter(currentBlog.post_date)}</h6>
                                            <div dangerouslySetInnerHTML={{ __html: currentBlog.body }} style={{ width: '100%', height: '100%' }}></div>
                                        </div>
                                            <button className='btn btn-small margin-b-16 margin-r-8 margin-t-8' onClick={() => handleBlogEditToggle(currentBlog.id, currentBlog.title, currentBlog.body, currentBlog.post_date, currentBlog.type)}>
                                            Edit
                                        </button>
                                        <button className='btn btn-small btn-x btn-gap' onClick={() => handleBlogDelete(currentBlog.id)}>
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default AdminBlogVendor;
