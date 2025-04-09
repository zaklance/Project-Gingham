import React, { useEffect, useState } from "react";
import { blogTimeConverter } from '../../utils/helpers';


function Home() {
    const [blogs, setBlogs] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const token = localStorage.getItem('admin_jwt-token');


    useEffect(() => {
        fetch("/api/blogs?for_admin=true")
            .then(response => response.json())
            .then(data => {
                const now = new Date();
                const filteredData = data.filter(blog => new Date(blog.post_date) <= now);
                const sortedData = filteredData.sort((a, b) => new Date(b.post_date) - new Date(a.post_date));
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
        <div className="admin-portal-background">
            <title>Gingham • Admin Portal</title>
            <br/>
            <br/>
            <br/>
            <h1 className="title-big text-blend-lighten m-title-big box-portal-home">Welcome</h1>
            {currentBlog && token ? (
                <div className="box-blog margin-t-48 margin-l-48 margin-r-48 badge-container no-float" id="blog">
                    <div className="badge-arrows">
                        <i className="icon-arrow-l margin-r-8" onClick={() => handleNavigate('prev')}>&emsp;&thinsp;</i>
                        <i className="icon-arrow-r" onClick={() => handleNavigate('next')}>&emsp;&thinsp;</i>
                    </div>
                    <h1>{currentBlog.type === 'General' ? null : `${currentBlog.type}: `}{currentBlog.title}</h1>
                    <h6 className="margin-b-8">{blogTimeConverter(currentBlog.post_date)}</h6>
                    <div dangerouslySetInnerHTML={{ __html: currentBlog.body }} style={{ width: '100%', height: '100%' }}></div>
                </div>
            ) : <></>}
        </div>
    )
}

export default Home;