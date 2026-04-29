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

/**
 * Get student seating plan
 * @param {string} cookies - Session cookies
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export async function getSeatingPlan(cookies) {
    try {
        const response = await fetch(`${API_BASE_URL}/seating-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cookies }),
        });

        // Log the raw response for debugging
        const responseText = await response.text();
        // console.log('🔍 Raw seating plan response:', responseText.substring(0, 500));

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            console.error('Response was:', responseText);
            throw new Error('Invalid JSON response from server');
        }

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch seating plan');
        }

        return data;
    } catch (error) {
        console.error('❌ Error in getSeatingPlan:', error);
        throw error;
    }
}


/**
 * Get student hostel information (VID, Name, Hostel, Room No)
 * @param {string} cookies - Session cookies
 */
export async function getHostelInfo(cookies) {
    const response = await fetch(`${API_BASE_URL}/hostel-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch hostel information');
    return data;
}

/**
 * Get the logged-in student's mutual shift post (by VID)
 */
export async function getMyMutualShiftPost(vid) {
    const response = await fetch(`${API_BASE_URL}/mutual-shift/${encodeURIComponent(vid)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch post');
    return data;
}

/**
 * Create a new mutual shift post
 */
export async function createMutualShiftPost(payload) {
    const response = await fetch(`${API_BASE_URL}/mutual-shift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create post');
    return data;
}

/**
 * Update an existing mutual shift post
 */
export async function updateMutualShiftPost(vid, updates) {
    const response = await fetch(`${API_BASE_URL}/mutual-shift/${encodeURIComponent(vid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update post');
    return data;
}

/**
 * Delete a mutual shift post
 */
export async function deleteMutualShiftPost(vid) {
    const response = await fetch(`${API_BASE_URL}/mutual-shift/${encodeURIComponent(vid)}`, {
        method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to delete post');
    return data;
}

export async function getAllMutualShiftPosts() {
    const response = await fetch(`${API_BASE_URL}/mutual-shift`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch posts');
    return data;
}
