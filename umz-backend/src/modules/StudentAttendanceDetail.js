import * as cheerio from 'cheerio';

export async function fetchStudentAttendanceDetail(client) {
    console.log('📊 Fetching Student Attendance Detail...');

    const response = await client.post(
        'https://ums.lpu.in/lpuums/StudentDashboard.aspx/StudentAttendanceDetail',
        {},
        {
            headers: {
                'Referer': 'https://ums.lpu.in/lpuums/StudentDashboard.aspx',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }
    );

    const html = response.data.d;
    const $ = cheerio.load(html);

    const courses = [];

    $('div.border').each((_, courseDiv) => {
        const $div = $(courseDiv);

        const courseHeading = $div.find('p.main-heading').first().text().trim();
        const codeMatch = courseHeading.match(/Course\s*code\s*:\s*([A-Z0-9]+)/i);
        const courseCode = codeMatch ? codeMatch[1].trim() : courseHeading;

        const attendanceRecords = [];

        $div.find('table tbody tr').each((_, row) => {
            const cols = $(row).find('td');

            if (cols.length >= 5) {
                attendanceRecords.push({
                    date: $(cols[0]).text().trim(),
                    time: $(cols[1]).text().trim(),
                    type: $(cols[2]).text().trim(),
                    status: $(cols[3]).text().trim(),
                    faculty: $(cols[4]).text().trim(),
                    remark: cols.length > 5 ? $(cols[5]).text().trim() : ''
                });
            }
        });

        if (courseCode && attendanceRecords.length) {
            courses.push({
                courseCode,
                totalRecords: attendanceRecords.length,
                presentCount: attendanceRecords.filter(r => r.status === 'P').length,
                absentCount: attendanceRecords.filter(r => r.status === 'A').length,
                records: attendanceRecords
            });
        }
    });

    // Pretty output
    console.log('\n📊 DETAILED ATTENDANCE RECORDS');
    console.log('══════════════════════════════════════════════════\n');

    courses.forEach(course => {
        console.log(`━━━ ${course.courseCode} ━━━`);
        console.log(`Total: ${course.totalRecords} | Present: ${course.presentCount} | Absent: ${course.absentCount}\n`);

        course.records.forEach((r, i) => {
            const dot = r.status === 'P' ? '🟢' : '🔴';
            console.log(
                ` ${String(i + 1).padStart(2)}. ${r.date.padEnd(12)} ${r.time.padEnd(18)} [${r.type}] ${dot} ${r.status} - ${r.faculty}`
            );
        });

        console.log('\n');
    });

    console.log('══════════════════════════════════════════════════\n');

    return courses;
}