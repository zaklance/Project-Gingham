import React, { useEffect } from 'react';

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;


const BrowserTimezone = () => {
    return (
        <div className='text-center margin-t-24'>
            <p className='text-timezone'>You are currently in the {browserTimezone} timezone</p>
        </div>
    );
};

export default BrowserTimezone;