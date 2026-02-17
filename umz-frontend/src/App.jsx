import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Attendance from './components/Attendance';
import Marks from './components/Marks';
import CGPA from './components/CGPA';
import TimeTable from './components/TimeTable';
import Courses from './components/Courses';
import Ranking from './components/Ranking';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/marks" element={<Marks />} />
        <Route path="/cgpa" element={<CGPA />} />
        <Route path="/time-table" element={<TimeTable />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/ranking" element={<Ranking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
