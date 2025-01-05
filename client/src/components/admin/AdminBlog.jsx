import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminBlogAdd from './AdminBlogAdd';
import AdminBlogEdit from './AdminBlogEdit';

const AdminBlog = () => {
    const [blogs, setBlogs] = useState([]);
    const [activeTab, setActiveTab] = useState('add');


    useEffect(() => {
            fetch("http://127.0.0.1:5555/api/blogs")
                .then(response => response.json())
                .then(data => setBlogs(data))
                .catch(error => console.error('Error fetching blogs', error));
    
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab) setActiveTab(tab);
        }, []);
    

    return (
        <>
            <div><div className='flex-start flex-center-align flex-gap-24 m-flex-wrap'>
                <h1 className='margin-b-16'>Blogs!</h1>
                <div className='tabs margin-t-20'>
                    <Link to="#" onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Add
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('edit')} className={activeTab === 'edit' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Edit
                    </Link>
                </div>
            </div>
                {activeTab === 'add' && <AdminBlogAdd />}
                {activeTab === 'edit' && <AdminBlogEdit blogs={blogs} setBlogs={setBlogs} />}
            </div>
        </>
    );
};

export default AdminBlog;