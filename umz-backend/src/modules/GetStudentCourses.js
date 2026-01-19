import * as cheerio from 'cheerio';

/**
 * Fetches student courses from UMS Dashboard
 * @param {import('axios').AxiosInstance} client - Authenticated Axios client
 * @returns {Promise<Array>} - Array of course data with details
 */
export async function fetchStudentCourses(client) {
    console.log('📊 Fetching Student Courses...');

    const response = await client.post(
        'https://ums.lpu.in/lpuums/StudentDashboard.aspx/GetStudentCourses',
        {},
        {
            headers: {
                'Referer': 'https://ums.lpu.in/lpuums/StudentDashboard.aspx'
            }
        }
    );

    const html = response.data.d;
    const $ = cheerio.load(html);

    const courses = [];

    // Parse each course div
    $('.mycoursesdiv').each((_, courseDiv) => {
        const $div = $(courseDiv);

        // Extract attendance percentage from the circular progress indicator
        const attendanceText = $div.find('.c100 span').text().trim();
        const attendance = attendanceText.replace('%', '');

        // Extract course details from the middle column
        const courseInfo = $div.find('.col-sm-6 p').first();

        // Extract course code and name
        const courseCodeElement = courseInfo.find('b').first();
        const courseCode = courseCodeElement.text().trim();
        const fullText = courseInfo.clone().children().remove().end().text();
        const courseName = fullText.split(':')[1]?.split('Term')[0]?.trim() || '';

        // Extract term
        const termText = courseInfo.html() || '';
        const termMatch = termText.match(/<b>Term\s*:\s*<\/b>(\d+\w*)/);
        const term = termMatch ? termMatch[1].trim() : '';

        // Extract roll number and group
        const rollNoElement = $div.find('.col-sm-6 p:nth-child(2)');
        const rollNoText = rollNoElement.text();
        const rollNoMatch = rollNoText.match(/Roll No\s*:\s*(.+?)\/\s*(.+)/);
        const rollNo = rollNoMatch ? rollNoMatch[1].trim() : '';
        const group = rollNoMatch ? rollNoMatch[2].trim() : '';

        // Extract exam pattern
        const examPatternElement = $div.find('.col-sm-6 p:nth-child(3)');
        const examPatternText = examPatternElement.text();
        const examPattern = examPatternText.replace('Exam Pattern :', '').trim();

        courses.push({
            courseCode,
            courseName,
            term,
            rollNo,
            group,
            examPattern,
            attendance
        });
    });

    console.log('\n� STUDENT COURSES\n');

    courses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.courseCode} - ${course.courseName}`);
        console.log(`   Term: ${course.term} | Attendance: ${course.attendance}%`);
        console.log(`   Roll No: ${course.rollNo} | Group: ${course.group}`);
        console.log(`   Exam Pattern: ${course.examPattern}`);
        console.log('');
    });

    return courses;
}
