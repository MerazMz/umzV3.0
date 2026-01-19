import * as cheerio from 'cheerio';
import fs from 'fs';

/**
 * Fetches student basic information from UMS
 * @param {import('axios').AxiosInstance} client - Authenticated Axios client
 * @returns {Promise<Object>} - Filtered student information
 */
export async function fetchStudentBasicInformation(client) {
    console.log('📊 Fetching Student Basic Information...');

    const response = await client.post(
        'https://ums.lpu.in/lpuums/StudentDashboard.aspx/GetStudentBasicInformation',
        {},
        {
            headers: {
                'Referer': 'https://ums.lpu.in/lpuums/StudentDashboard.aspx'
            }
        }
    );

    const data = response.data.d;

    // The response is an array with one object
    const studentInfo = data[0];

    // Filter out null values
    const filteredInfo = {};
    for (const [key, value] of Object.entries(studentInfo)) {
        if (value !== null && value !== '') {
            filteredInfo[key] = value;
        }
    }

    // Save student picture if available
    if (filteredInfo.StudentPicture) {
        try {
            // Decode base64 image and save
            const imageBuffer = Buffer.from(filteredInfo.StudentPicture, 'base64');
            fs.writeFileSync('image.png', imageBuffer);
            console.log('✅ Student picture saved as image.png');
        } catch (error) {
            console.error('❌ Error saving image:', error.message);
        }
    }

    // Display filtered information
    console.log('\n👤 STUDENT BASIC INFORMATION\n');
    console.log('═══════════════════════════════════════════\n');

    // Display in a formatted way
    const displayOrder = [
        'StudentName',
        'Registrationnumber',
        'RollNumber',
        'StudentEmail',
        'StudentMobile',
        'Program',
        'Section',
        'BatchYear',
        'DateofBirth',
        'Gender',
        'CGPA',
        'AggAttendance',
        'PendingFee',
        'FatherName',
        'MotherName',
        'FatherMobile',
        'FatherEmail',
        'MotherMobile',
        'MotherEmail'
    ];

    // Display ordered fields first
    displayOrder.forEach(key => {
        if (filteredInfo[key]) {
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            console.log(`${label}: ${filteredInfo[key]}`);
        }
    });

    // Display remaining fields that weren't in displayOrder
    console.log('\n--- Additional Information ---\n');
    for (const [key, value] of Object.entries(filteredInfo)) {
        if (!displayOrder.includes(key) && key !== 'StudentPicture' && key !== '__type') {
            const label = key.replace(/([A-Z])/g, ' $1').trim();
            console.log(`${label}: ${value}`);
        }
    }

    console.log('\n═══════════════════════════════════════════\n');

    return filteredInfo;
}
