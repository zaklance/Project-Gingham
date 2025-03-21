// Time Conversions and Formatting
export function timeConverter(time24) {
    const [hours, minutes, seconds] = time24.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0);
    const time12 = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });
    if (time12.includes(':00')) {
        return time12.replace(/:00/, '').trim();
    }
    return time12;
}

export function blogTimeConverter(postedAt) {
    const [date] = postedAt.split(/T| /);
    const [year, month, day] = date.split('-');
    const formattedDate = `${year}.${month}.${day}`;
    return formattedDate;
}

export function fileTimeConverter(postedAt) {
    const [date] = postedAt.split(/T| /);
    const [year, month, day] = date.split('-');
    const formattedDate = `${year}-${month}${day}`;
    return formattedDate;
}

export function marketDateConvert(sale_date) {
    const [date] = sale_date.split(/T| /);
    const [year, month, day] = date.split('-');
    const formattedDate = `${month}/${day}`;
    return formattedDate;
}

export function convertToLocalDate(gmtDateString) {
    const [year, month, day] = gmtDateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatToLocalDateString(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export const formatTime = (time) => {
    const [hour, minute] = time.split(':');
    const formattedHour = hour.padStart(2, '0');
    const formattedMinute = minute ? minute.padStart(2, '0') : '00';
    return `${formattedHour}:${formattedMinute}`;
};

export function formatDate(dateString) {
    if (!dateString || dateString.length !== 10) return "Invalid Date";

    const date = new Date(dateString + "T00:00:00");

    if (isNaN(date.getTime())) return "Invalid Date";

    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
    const day = date.getDate();

    return `${monthName} ${day}`;
}

export function formatBasketDate(dateInput) {
    if (!dateInput) return "Invalid Date";

    let date;
    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === "string") {
        const dateParts = dateInput.split("T")[0].split("-");
        if (dateParts.length === 3) {
            const [year, month, day] = dateParts.map(Number);
            date = new Date(year, month - 1, day);
        } else {
            return "Invalid Date";
        }
    } else {
        return "Invalid Date";
    }

    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export const isToday = (date) => {
    if (isNaN(new Date(date))) {
        return false;
    }

    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    const dateFormatted = new Date(date).toISOString().split('T')[0];
    return dateFormatted === todayFormatted;
};


export const formatPickupText = (basket, timeConverter, marketDateConvert) => {
    if (!basket) return '';
    const { sale_date, pickup_start, pickup_end } = basket;
    if (isToday(sale_date)) {
        return `Pick Up Today at ${timeConverter(pickup_start)} - ${timeConverter(pickup_end)}`;
    } else {
        return `Pick Up: ${marketDateConvert(sale_date)} at ${timeConverter(pickup_start)} - ${timeConverter(pickup_end)}`;
    }
};

export function formatEventDate(dateString) {   
    const date = new Date(dateString + "T00:00:00");

    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function receiptDateConverter(dateString) {
    if (!dateString) return "N/A"; 
    
    let date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
        date = new Date(dateString + "T00:00:00");
    }

    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString('en-CA');
}

// Input Conversions and Formatting
export const formatPhoneNumber = (phone, countryCode = '+1') => {
    const cleaned = ('' + phone).replace(/\D/g, '');

    const normalized = cleaned.length === 11 && cleaned.startsWith('1') ? cleaned.slice(1) : cleaned;

    const match = normalized.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `${countryCode} (${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
};


// Link Generators

