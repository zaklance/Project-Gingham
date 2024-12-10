
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
    return time12;
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

export function formatDate(dateString) {
    if (!dateString || dateString.length !== 10) return "Invalid Date";

    const date = new Date(dateString + "T00:00:00");

    if (isNaN(date.getTime())) return "Invalid Date";

    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
    const day = date.getDate();

    return `${monthName} ${day}`;
}

export function formatBasketDate(dateInput) {
    try {
        if (!dateInput) {
            console.warn('Invalid date input:', dateInput);
            return 'Invalid Date';
        }

        let date;
        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'string') {
            const dateParts = dateInput.split('-');
            if (dateParts.length !== 3) {
                console.error('Invalid date string format:', dateInput);
                return 'Invalid Date';
            }
            date = new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T00:00:00`);
        } else {
            console.error('Unsupported date format:', dateInput);
            return 'Invalid Date';
        }

        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateInput);
            return 'Invalid Date';
        }

        const formattedDate = date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return formattedDate;
    } catch (error) {
        console.error('Error converting date:', error);
        return 'Invalid Date';
    }
}

export function formatEventDate(dateString) {   
    const date = new Date(dateString + "T00:00:00");

    if (isNaN(date.getTime())) return "Invalid Date";

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// Input Conversions and Formatting
export const formatPhoneNumber = (phone) => {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
};

// Link Generators

