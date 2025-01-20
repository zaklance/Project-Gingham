import React, { useEffect, useRef, useState } from 'react';
import { blogTimeConverter } from '../../utils/helpers';

const AdminBlogEdit = ({ blogs, setBlogs }) => {
    const [tempBlogData, setTempBlogData] = useState(null);
    const [editingBlogId, setEditingBlogId] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const textareasRef = useRef([]);

    const handleBlogUpdate = async (blogId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5555/api/blogs/${blogId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tempBlogData),
            });

            if (response.ok) {
                const updatedBlog = await response.json();
                setBlogs((prev) =>
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

                fetch(`http://127.0.0.1:5555/api/blogs/${id}`, {
                    method: "DELETE",
                }).then(() => {
                    setBlogs((prev) => prev.filter((item) => item.id !== id))
                })
            } catch (error) {
                console.error("Error deleting blog", error)
            }
        }
    }

    const handleEditInputChange = (event) => {
        const { name, value } = event.target;
        setTempBlogData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleBlogEditToggle = (id, title, body, post_date, type, for_user, for_vendor, for_admin) => {
        setEditingBlogId(id);
        setTempBlogData({ title, body, post_date, type, for_user, for_vendor, for_admin });
    };
    
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
        <>
            <div>
                <h2>Edit Blogs</h2>
                <div className='margin-t-16'>
                    <h3>{currentBlog.for_user ? 'For User' : ''}{currentBlog.for_vendor ? 'For Vendor' : ''}{currentBlog.for_admin ? 'For Admin' : ''}; Type: {currentBlog.type}</h3>
                </div>
                <div className='flex-wrap'>
                    <div style={{ borderBottom: '1px solid #ccc', padding: '8px 0' }}>
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
                                        <label>Body HTML:</label>
                                        <textarea
                                            id="html-input"
                                            name="body"
                                            value={tempBlogData.body}
                                            placeholder="Type something..."
                                            onChange={handleEditInputChange}
                                            onKeyDown={handleTabKey}
                                            ref={(el) => (textareasRef.current[0] = el)}
                                        />
                                    </div>
                                    <button className='btn btn-small margin-t-24 margin-r-8' onClick={() => handleBlogUpdate(currentBlog.id)}>Save</button>
                                <button className='btn btn-small btn-gap' onClick={() => setEditingBlogId(null)}>Cancel</button>
                                </div>
                                <div className="box-blog margin-t-16 badge-container">
                                    <div className="badge-arrows">
                                        <i className="icon-arrow-l margin-r-8">&emsp;&thinsp;</i>
                                        <i className="icon-arrow-r">&emsp;&thinsp;</i>
                                    </div>
                                    <h1>{tempBlogData.title}</h1>
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
                                    </div>
                                    <h1>{currentBlog.title}</h1>
                                    <h6 className="margin-b-8">{blogTimeConverter(currentBlog.post_date)}</h6>
                                    <div dangerouslySetInnerHTML={{ __html: currentBlog.body }} style={{ width: '100%', height: '100%' }}></div>
                                </div>
                                <button className='btn btn-small margin-b-16 margin-r-8 margin-t-8' onClick={() => handleBlogEditToggle(currentBlog.id, currentBlog.title, currentBlog.body, currentBlog.post_date)}>
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
    );
};

export default AdminBlogEdit;