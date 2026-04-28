import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import SessionPool from './src/utils/SessionPool.js';
import { createAxiosClient } from './src/utils/createAxiosClient.js';
import { fetchStudentBasicInformation } from './src/modules/GetStudentBasicInformation.js';
import { fetchStudentAttendanceSummary } from './src/modules/StudentAttendanceSummary.js';
import { fetchStudentAttendanceDetail } from './src/modules/StudentAttendanceDetail.js';
import { fetchTermwiseCGPA } from './src/modules/TermwiseCGPA.js';
import { fetchTermWiseMarks } from './src/modules/TermWiseMarks.js';
import { fetchStudentMessages } from './src/modules/GetStudentMessages.js';
import { fetchTimeTable } from './src/modules/GetTimeTable.js';
import { fetchStudentCourses } from './src/modules/GetStudentCourses.js';
import { fetchStudentSeatingPlan } from './src/modules/GetSeatingPlan.js';
import { fetchPasswordExpiry } from './src/modules/GetPasswordExpiry.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize SessionPool with max 20 concurrent Playwright sessions
const sessionPool = new SessionPool(20);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// In-memory session storage
// Structure: Map<sessionId, { browser, page, regno, password, timestamp }>
const sessions = new Map();

// Session timeout: 5 minutes
const SESSION_TIMEOUT = 5 * 60 * 1000;

/**
 * Cleanup expired sessions
 */
function cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of sessions.entries()) {
        if (now - session.timestamp > SESSION_TIMEOUT) {
            console.log(`🧹 Cleaning up expired session: ${sessionId}`);
            session.browser.close().catch(console.error);
            sessions.delete(sessionId);
        }
    }
}

// Run cleanup every minute
setInterval(cleanupExpiredSessions, 60 * 1000);

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'UMZ Backend is running',
        timestamp: new Date().toISOString(),
        activeSessions: sessions.size,
        poolStatus: sessionPool.getStatus()
    });
});


/**
 * POST /api/start-login
 * Start the login process - fill regno and get captcha
 */
app.post('/api/start-login', async (req, res) => {
    const { regno, password } = req.body;

    if (!regno || !password) {
        return res.status(400).json({
            success: false,
            error: 'Registration number and password are required'
        });
    }

    // Log pool status before acquiring
    const poolStatus = sessionPool.getStatus();
    console.log(`📊 Pool Status: ${poolStatus.active}/${poolStatus.maxActive} active, ${poolStatus.queued} queued, ${poolStatus.available} available`);

    let browser, page;

    try {
        // Execute within session pool to enforce concurrency limit
        const result = await sessionPool.run(async () => {
            console.log(`🌐 Starting login process for: ${regno}`);

            // Launch browser
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            });
            page = await context.newPage();

            // Navigate to login page
            console.log('📄 Loading login page...');
            await page.goto('https://ums.lpu.in/lpuums/', { waitUntil: 'networkidle' });

            // Fill registration number
            console.log('📝 Entering registration number...');
            const regnoField = page.locator('input[name="txtU"]');
            await regnoField.click();
            await page.waitForTimeout(300);
            await regnoField.type(regno, { delay: 100 });
            await page.waitForTimeout(500);
            await regnoField.blur();

            // Wait for captcha to load
            console.log('🖼️  Waiting for captcha...');
            await page.waitForSelector('#c_loginnew_examplecaptcha_CaptchaImage', { timeout: 10000 });

            // Screenshot captcha and convert to base64
            const captchaElement = await page.$('#c_loginnew_examplecaptcha_CaptchaImage');
            const captchaBuffer = await captchaElement.screenshot();
            const captchaBase64 = `data:image/png;base64,${captchaBuffer.toString('base64')}`;

            // Generate session ID
            const sessionId = uuidv4();

            // Store session
            sessions.set(sessionId, {
                browser,
                page,
                regno,
                password,
                timestamp: Date.now()
            });

            console.log(`✅ Session created: ${sessionId}`);

            return {
                success: true,
                sessionId,
                captchaImage: captchaBase64
            };
        });

        return res.json(result);

    } catch (error) {
        console.error('❌ Error in start-login:', error.message);

        // Cleanup on error
        if (browser) {
            await browser.close().catch(console.error);
        }

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/complete-login
 * Complete the login - fill captcha and password, then login
 */
app.post('/api/complete-login', async (req, res) => {
    const { sessionId, captcha } = req.body;

    if (!sessionId || !captcha) {
        return res.status(400).json({
            success: false,
            error: 'Session ID and captcha are required'
        });
    }

    // Retrieve session
    const session = sessions.get(sessionId);
    if (!session) {
        return res.status(404).json({
            success: false,
            error: 'Session not found or expired'
        });
    }

    const { browser, page, password } = session;

    try {
        console.log(`🔐 Completing login for session: ${sessionId}`);

        // Fill captcha
        console.log('✍️  Filling captcha...');
        const captchaField = page.locator('input[name="CaptchaCodeTextBox"]');
        await captchaField.click();
        await page.waitForTimeout(200);
        await captchaField.type(captcha, { delay: 120 });
        await page.waitForTimeout(400);

        // Fill password
        console.log('🔑 Filling password...');
        const pwdField = page.locator('input[type="password"]');
        await pwdField.click();
        await page.waitForTimeout(200);
        await pwdField.type(password, { delay: 100 });
        await page.waitForTimeout(600);

        // Select Dashboard option in dropdown
        // console.log('📋 Selecting Dashboard option...');
        const dropdown = page.locator('select[name="ddlStartWith"]');
        await dropdown.selectOption({ value: 'StudentDashboard.aspx' });
        await page.waitForTimeout(300);

        // Click login button
        console.log('🔘 Clicking login...');
        const loginButton = page.locator('input[type="submit"][value="Login"]');
        await loginButton.click();
        await page.waitForTimeout(300);

        // Wait for navigation result
        try {
            await page.waitForURL('**/StudentDashboard.aspx', { timeout: 10000 });
            console.log('✅ Login successful!');
        } catch (error) {
            const currentUrl = page.url();
            if (currentUrl.includes('lpuums/') && !currentUrl.includes('StudentDashboard')) {
                throw new Error('Login failed - Invalid credentials or captcha');
            }
            throw error;
        }

        // Extract cookies
        console.log('🍪 Extracting cookies...');
        const context = page.context();
        const cookies = await context.cookies();
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        // Close browser and cleanup session
        console.log('✅ Closing browser and cleaning up session...');
        await browser.close();
        sessions.delete(sessionId);

        return res.json({
            success: true,
            cookies: cookieString
        });

    } catch (error) {
        console.error('❌ Error in complete-login:', error.message);

        // Cleanup on error
        await browser.close().catch(console.error);
        sessions.delete(sessionId);

        return res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/student-info
 * Fetch student basic information using stored cookies
 */
app.post('/api/student-info', async (req, res) => {
    const { cookies } = req.body;

    if (!cookies) {
        return res.status(400).json({
            success: false,
            error: 'Cookies are required'
        });
    }

    try {
        console.log('📊 Fetching student information...');

        // Create axios client with cookies
        const axiosClient = createAxiosClient(cookies);

        // Fetch student basic information, term-wise CGPA, messages, and password expiry in parallel
        const [studentInfo, termwiseCGPA, messages, passwordExpiry] = await Promise.all([
            fetchStudentBasicInformation(axiosClient),
            fetchTermwiseCGPA(axiosClient),
            fetchStudentMessages(axiosClient),
            fetchPasswordExpiry(axiosClient)
        ]);

        // Combine the data
        const combinedData = {
            ...studentInfo,
            TermwiseCGPA: termwiseCGPA,
            Messages: messages,
            PasswordExpiry: passwordExpiry
        };

        return res.json({
            success: true,
            data: combinedData
        });

    } catch (error) {
        console.error('❌ Error fetching student info:', error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/attendance
 * Fetch student attendance data using stored cookies
 */
app.post('/api/attendance', async (req, res) => {
    const { cookies } = req.body;

    if (!cookies) {
        return res.status(400).json({
            success: false,
            error: 'Cookies are required'
        });
    }

    try {
        console.log('📊 Fetching attendance data...');

        // Create axios client with cookies
        const axiosClient = createAxiosClient(cookies);

        // Fetch both summary and detailed attendance
        const [summary, detail] = await Promise.all([
            fetchStudentAttendanceSummary(axiosClient),
            fetchStudentAttendanceDetail(axiosClient)
        ]);

        return res.json({
            success: true,
            data: {
                summary,
                detail
            }
        });

    } catch (error) {
        console.error('❌ Error fetching attendance:', error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/attendance-details
 * Fetch detailed subject-wise attendance using stored cookies
 */
app.post('/api/attendance-details', async (req, res) => {
    const { cookies } = req.body;

    if (!cookies) {
        return res.status(400).json({
            success: false,
            error: 'Cookies are required'
        });
    }

    try {
        console.log('📊 Fetching detailed attendance data...');

        // Create axios client with cookies
        const axiosClient = createAxiosClient(cookies);

        // Fetch detail and summary in parallel so we can use UMS's official percent per subject
        const [attendanceDetail, attendanceSummary] = await Promise.all([
            fetchStudentAttendanceDetail(axiosClient),
            fetchStudentAttendanceSummary(axiosClient)
        ]);

        // Build a lookup map: courseCode → summary row (for fast matching)
        const summaryMap = new Map();
        for (const row of attendanceSummary) {
            if (row.courseCode) {
                summaryMap.set(row.courseCode, row);
            }
        }

        // Merge the official UMS percent + duty leave + lastDate into each detail course
        const merged = attendanceDetail.map(course => {
            const summaryRow = summaryMap.get(course.courseCode);
            return {
                ...course,
                // UMS-official percentage string (e.g. "82.35%") from summary; null if not matched
                summaryPercent: summaryRow ? summaryRow.percent  : null,
                // Duty leave / OD count from summary
                od:             summaryRow ? summaryRow.od       : null,
                // Last attendance date from summary
                lastDate:       summaryRow ? summaryRow.lastDate : null,
                // Full course title from summary
                courseTitle:    summaryRow ? summaryRow.course   : null,
            };
        });

        return res.json({
            success: true,
            data: merged
        });

    } catch (error) {
        console.error('❌ Error fetching attendance details:', error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint with session pool stats
 */
app.get('/api/health', (req, res) => {
    const poolStatus = sessionPool.getStatus();
    res.json({
        status: 'ok',
        activeSessions: sessions.size,
        pool: {
            active: poolStatus.active,
            maxActive: poolStatus.maxActive,
            queued: poolStatus.queued,
            available: poolStatus.available
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 UMS Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 Accepting requests from React frontend`);
});

/**
 * POST /api/marks
 * Fetch term-wise marks data using stored cookies
 */
app.post('/api/marks', async (req, res) => {
    const { cookies } = req.body;

    if (!cookies) {
        return res.status(400).json({
            success: false,
            error: 'Cookies are required'
        });
    }

    try {
        console.log('📊 Fetching term-wise marks...');

        const axiosClient = createAxiosClient(cookies);
        const marksData = await fetchTermWiseMarks(axiosClient);

        return res.json({
            success: true,
            data: marksData
        });

    } catch (error) {
        console.error('❌ Error fetching marks:', error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/timetable
 * Fetch student timetable using stored cookies
 */
app.post('/api/timetable', async (req, res) => {
    const { cookies } = req.body;

    if (!cookies) {
        return res.status(400).json({
            success: false,
            error: 'Cookies are required'
        });
    }

    try {
        console.log('📅 Fetching student timetable...');

        const axiosClient = createAxiosClient(cookies);

        // First, fetch courses to get the termId
        const coursesData = await fetchStudentCourses(axiosClient);

        if (!coursesData || coursesData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No courses found - cannot determine term ID'
            });
        }

        // Get termId from the first course
        const termId = coursesData[0].term;
        console.log(`📋 Using Term ID: ${termId}`);

        // Fetch timetable with the termId
        const timetableData = await fetchTimeTable(axiosClient, termId);

        return res.json({
            success: true,
            data: timetableData
        });

    } catch (error) {
        console.error('❌ Error fetching timetable:', error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/courses
 * Fetch student courses using stored cookies
 */
app.post('/api/courses', async (req, res) => {
    const { cookies } = req.body;

    if (!cookies) {
        return res.status(400).json({
            success: false,
            error: 'Cookies are required'
        });
    }

    try {
        console.log('📚 Fetching student courses...');

        const axiosClient = createAxiosClient(cookies);
        const coursesData = await fetchStudentCourses(axiosClient);

        return res.json({
            success: true,
            data: coursesData
        });

    } catch (error) {
        console.error('❌ Error fetching courses:', error.message);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/seating-plan
 * Fetch student seating plan using stored cookies
 */
app.post('/api/seating-plan', async (req, res) => {
    const { cookies } = req.body;

    if (!cookies) {
        return res.status(400).json({
            success: false,
            error: 'Cookies are required'
        });
    }

    try {
        console.log('🪑 Fetching student seating plan...');

        const axiosClient = createAxiosClient(cookies);
        const seatingPlanData = await fetchStudentSeatingPlan(axiosClient);

        console.log(`✅ Seating plan fetched successfully. Items: ${seatingPlanData?.length || 0}`);
        console.log('📤 Sending response:', JSON.stringify({
            success: true,
            data: seatingPlanData
        }).substring(0, 300));

        return res.json({
            success: true,
            data: seatingPlanData
        });

    } catch (error) {
        console.error('❌ Error fetching seating plan:', error.message);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ranking
 * Proxy endpoint for student ranking - avoids CORS issues
 */
app.post('/api/ranking', async (req, res) => {
    const { registrationNumber } = req.body;

    if (!registrationNumber) {
        return res.status(400).json({
            success: false,
            error: 'Registration number is required'
        });
    }

    try {
        console.log(`🏆 Fetching ranking for: ${registrationNumber}`);

        const response = await axios.post(
            'https://lpu-student-ranking.vercel.app/get-student-info',
            { registrationNumber }
        );

        return res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('❌ Error fetching ranking:', error.message);

        return res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});
