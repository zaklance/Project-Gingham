import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AdminMarketEdit from './AdminMarketEdit'
import AdminMarketAdd from './AdminMarketAdd'


function AdminMarkets () {
    const [markets, setMarkets] = useState([]);
    const [activeTab, setActiveTab] = useState('edit');
    
    const weekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    const weekdayReverse = {
        "Monday": 0,
        "monday": 0,
        "Tuesday": 1,
        "tuesday": 1,
        "Wednesday": 2,
        "wednesday": 2,
        "Thursday": 3,
        "thursday": 3,
        "Friday": 4,
        "friday": 4,
        "Saturday": 5,
        "saturday": 5,
        "Sunday": 6,
        "sunday": 6
    }

    function timeConverter(time24) {
        const date = new Date('1970-01-01T' + time24);

        const time12 = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        return time12
    }

    useEffect(() => {
        fetch("http://127.0.0.1:5555/markets")
            .then(response => response.json())
            .then(markets => setMarkets(markets))
            .catch(error => console.error('Error fetching markets', error));
    }, []);

    
    return(
        <div>
            <div className='flex-start flex-center-align flex-gap'>
                <h2 className=''>Markets Management:</h2>
                <div className='tabs margin-t-20'>                
                    <Link to="#" onClick={() => setActiveTab('edit')} className={activeTab === 'edit' ? 'active-tab btn btn-reset btn-tab margin-r-24' : 'btn btn-reset btn-tab margin-r-24'}>
                        Edit
                    </Link>
                    <Link to="#" onClick={() => setActiveTab('add')} className={activeTab === 'add' ? 'active-tab btn btn-reset btn-tab' : 'btn btn-reset btn-tab'}>
                        Add
                    </Link>
                </div>
            </div>
            {activeTab === 'edit' && <AdminMarketEdit markets={markets} timeConverter={timeConverter} weekday={weekday} weekdayReverse={weekdayReverse} /> }
            {activeTab === 'add' && <AdminMarketAdd markets={markets} weekdayReverse={weekdayReverse} />}
        </div>
    )
}

export default AdminMarkets;