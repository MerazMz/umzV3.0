/**
 * Generates an .ics string for a student's timetable
 */
export const generateICSString = (timetableData, studentName) => {
    const dayMap = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const dayToICS = {
        'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE', 'Thursday': 'TH', 'Friday': 'FR', 'Saturday': 'SA', 'Sunday': 'SU'
    };

    const today = new Date();
    const currentDay = today.getDay();

    const formatICSDate = (date, timeStr) => {
        const [hours, minutes] = timeStr.split(':');
        const d = new Date(date);
        d.setHours(parseInt(hours), parseInt(minutes), 0);
        
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const s = '00';
        
        return `${y}${m}${day}T${h}${min}${s}`;
    };

    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 5);
    const untilStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//UMZ//Timetable//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:LPU Timetable - ' + studentName,
        'X-WR-TIMEZONE:Asia/Kolkata'
    ];

    Object.entries(timetableData).forEach(([dayName, classes]) => {
        if (!classes || classes.length === 0) return;

        const targetDay = dayMap[dayName];
        const diff = targetDay - currentDay;
        const baseDate = new Date(today);
        baseDate.setDate(today.getDate() + diff);

        classes.forEach((cls, idx) => {
            if (!cls.time || !cls.time.includes('-')) return;

            const [startTimeStr, endTimeStr] = cls.time.split('-');
            const dtStart = formatICSDate(baseDate, startTimeStr);
            const dtEnd = formatICSDate(baseDate, endTimeStr);

            const summary = `${cls.type}: ${cls.courseCode}`;
            const location = `Room: ${cls.room || 'N/A'}`;
            const description = [
                `Teacher: ${cls.teacher || 'N/A'}`,
                `Section: ${cls.section || 'N/A'}`,
                `Group: ${cls.group || 'N/A'}`,
                `Last Synced: ${new Date().toLocaleString('en-IN')}`,
                `Powered by UMZ`
            ].join('\\n');

            icsContent.push('BEGIN:VEVENT');
            icsContent.push(`UID:${Date.now()}-${idx}-${dayName}@umz.zippy`);
            icsContent.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
            icsContent.push(`DTSTART;TZID=Asia/Kolkata:${dtStart}`);
            icsContent.push(`DTEND;TZID=Asia/Kolkata:${dtEnd}`);
            icsContent.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayToICS[dayName]};UNTIL=${untilStr}`);
            icsContent.push(`SUMMARY:${summary}`);
            icsContent.push(`LOCATION:${location}`);
            icsContent.push(`DESCRIPTION:${description}`);
            icsContent.push('END:VEVENT');
        });
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.join('\r\n');
};
