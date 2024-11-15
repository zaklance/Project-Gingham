import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import AdminMarketEdit from './AdminMarketEdit'
import AdminMarketAdd from './AdminMarketAdd'


function AdminMarkets () {
    const [markets, setMarkets] = useState([]);
    const [marketDayDetails, setMarketDayDetails] = useState([])
    const [marketDays, setMarketDays] = useState([])
    const [selectedDay, setSelectedDay] = useState(null);
    const [query, setQuery] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [editDayMode, setEditDayMode] = useState(false);
    const [adminMarketData, setAdminMarketData] = useState(null);
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

    
    return(
        <div>
            <div className='flex-start flex-center-align flex-gap'>
                <h2 className='title'>Markets Management:</h2>
                <div className='tabs'>                
                    <button className='btn btn-reset btn-tab'><Link to="#" onClick={() => setActiveTab('edit')} className={activeTab === 'market-edit' ? 'active' : ''}>
                        Edit
                    </Link></button>
                    <button className='btn btn-reset btn-tab'><Link to="#" onClick={() => setActiveTab('add')} className={activeTab === 'market-add' ? 'active' : ''}>
                        Add
                    </Link></button>
                </div>
            </div>
            {activeTab === 'edit' && <AdminMarketEdit timeConverter={timeConverter} weekday={weekday} /> }
            {activeTab === 'add' && <AdminMarketAdd />}
        </div>
    )
}

export default AdminMarkets;