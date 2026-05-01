import mongoose from 'mongoose';

const StudentCalendarSchema = new mongoose.Schema({
    regno: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    studentName: {
        type: String,
        default: 'Student'
    },
    timetable: {
        type: Object,
        required: true
    },
    syncToken: {
        type: String,
        required: true,
        unique: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const StudentCalendar = mongoose.model('StudentCalendar', StudentCalendarSchema);

export default StudentCalendar;
