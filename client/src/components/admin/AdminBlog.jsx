import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminBlogAdmin from './AdminBlogAdmin';
import AdminBlogUser from './AdminBlogUser';
import AdminBlogVendor from './AdminBlogVendor';

const AdminBlog = () => {
    const [blogs, setBlogs] = useState([]);
    const [activeTab, setActiveTab] = useState('user');
    const [activeTabMode, setActiveTabMode] = useState('add');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) setActiveTab(tab);
    }, []);

    useEffect(() => {
            fetch("/api/blogs")
                .then(response => response.json())
                .then(data => {
                    const sortedData = data.sort((a, b) => new Date(b.post_date) - new Date(a.post_date));
                    setBlogs(sortedData);
                })
                .catch(error => console.error('Error fetching blogs', error));
        }, []);
    

    return (
        <>
            <div>
                <div className='flex-start flex-top-align flex-gap-24 m-flex-wrap'>
                    <h1 className='margin-b-16'>Blogs!</h1>
                    <div className='tabs margin-t-20'>
                        <Link to="/admin/blog?tab=user" onClick={() => setActiveTab('user')} className={activeTab === 'user' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            User
                        </Link>
                        <Link to="/admin/blog?tab=vendor" onClick={() => setActiveTab('vendor')} className={activeTab === 'vendor' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            Vendor
                        </Link>
                        <Link to="/admin/blog?tab=admin" onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                            Admin
                        </Link>
                    </div>
                    <h1>|</h1>
                    <div className='tabs margin-t-20'>
                        <Link onClick={() => setActiveTabMode('add')} className={activeTabMode === 'add' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            add
                        </Link>
                        <Link onClick={() => setActiveTabMode('edit')} className={activeTabMode === 'edit' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                            edit
                        </Link>
                    </div>
                </div>
                {activeTab === 'user' && <AdminBlogUser blogs={blogs} setBlogs={setBlogs} activeTabMode={activeTabMode} />}
                {activeTab === 'vendor' && <AdminBlogVendor blogs={blogs} setBlogs={setBlogs} activeTabMode={activeTabMode} />}
                {activeTab === 'admin' && <AdminBlogAdmin blogs={blogs} setBlogs={setBlogs} activeTabMode={activeTabMode} />}
            </div>
        </>
    );
};

export default AdminBlog;