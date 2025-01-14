import React, { useEffect, useRef, useState } from 'react';
import { blogTimeConverter } from '../../utils/helpers';

const AdminBlogAdd = () => {
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState(''); // Date only
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

    const textareasRef = useRef([]);
    const adminId = parseInt(globalThis.localStorage.getItem('admin_user_id'));

    const postBlog = async () => {
        if (confirm(`Are you sure you want to post the blog "${newTitle}" to the site?`)) {
            try {
                const postedAt = new Date(newDate); // Convert to a JavaScript Date object
                const response = await fetch('http://127.0.0.1:5555/api/blogs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: newTitle,
                        body: newBlog,
                        post_date: postedAt.toISOString(), // Convert Date to ISO string
                        admin_user_id: adminId,
                    }),
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Blog posted successfully!');
                    console.log(result);
                } else {
                    alert('Error posting blog:', result.error);
                }
            } catch (error) {
                console.error('Error sending blog:', error);
            }
        }
    };

    useEffect(() => {
        textareasRef.current.forEach((textarea) => {
            if (textarea) {
                textarea.addEventListener('keydown', handleTabKey);
            }
        });

        return () => {
            textareasRef.current.forEach((textarea) => {
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

    return (
        <>
            <div className='box-bounding'>
                <h2 className='margin-b-16'>Add Blogs</h2>
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
                        id="htmlinput"
                        value={newBlog}
                        onChange={(e) => setNewBlog(e.target.value)}
                        placeholder="Type something..."
                        ref={(el) => (textareasRef.current[0] = el)}
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
                </div>
                <h1>{newTitle}</h1>
                <h6 className="margin-b-8">{blogTimeConverter(newDate)}</h6>
                <div dangerouslySetInnerHTML={{ __html: newBlog }} style={{ width: '100%', height: '100%'}}></div>
            </div>
        </>
    );
};

export default AdminBlogAdd;
