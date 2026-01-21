const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Start the login process
 * @param {string} regno - Registration number
 * @param {string} password - Password
 * @returns {Promise<{sessionId: string, captchaImage: string}>}
 */
export async function startLogin(regno, password) {
    const response = await fetch(`${API_BASE_URL}/start-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ regno, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to start login');
    }

    return data;
}

/**
 * Complete the login process
 * @param {string} sessionId - Session ID from start-login
 * @param {string} captcha - Captcha text entered by user
 * @returns {Promise<{success: boolean, cookies: string}>}
 */
export async function completeLogin(sessionId, captcha) {
    const response = await fetch(`${API_BASE_URL}/complete-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, captcha }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to complete login');
    }

    return data;
}

/**
 * Get student basic information
 * @param {string} cookies - Cookie string from login
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getStudentInfo(cookies) {
    const response = await fetch(`${API_BASE_URL}/student-info`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookies }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch student information');
    }

    return data;
}

/**
 * Get student attendance data
 * @param {string} cookies - Cookie string from login
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getAttendance(cookies) {
    const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookies }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attendance data');
    }

    return data;
}

/**
 * Get detailed student attendance data (subject-wise)
 * @param {string} cookies - Cookie string from login
 * @returns {Promise<{success: boolean, data: array}>}
 */
export async function getAttendanceDetails(cookies) {
    const response = await fetch(`${API_BASE_URL}/attendance-details`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookies }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attendance details');
    }

    return data;
}

/**
 * Get term-wise marks data
 * @param {string} cookies - Session cookies
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function getMarks(cookies) {
    const response = await fetch(`${API_BASE_URL}/marks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookies }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch marks');
    }

    return data;
}

/**
 * Get student timetable
 * @param {string} cookies - Session cookies
 * @returns {Promise<{success: boolean, data: Object}>}
 */
export async function getTimeTable(cookies) {
    const response = await fetch(`${API_BASE_URL}/timetable`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookies }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch timetable');
    }

    return data;
}

/**
 * Get student courses
 * @param {string} cookies - Session cookies
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function getCourses(cookies) {
    const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookies }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch courses');
    }

    return data;
}

