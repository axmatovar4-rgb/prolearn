import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Splash from './pages/Splash';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import EmployeeForm from './pages/EmployeeForm';
import Attendance from './pages/Attendance';
import Salary from './pages/Salary';
import MyProfile from './pages/MyProfile';
import Settings from './pages/Settings';
import Vacation from './pages/Vacation';
import Requests from './pages/Requests';
import Messages from './pages/Messages';
import SalaryHistory from './pages/SalaryHistory';
import BlockedEmployees from './pages/BlockedEmployees';
import Schedule from './pages/Schedule';

const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
const PrivateRoute = ({ children }) => localStorage.getItem('token') ? children : <Navigate to="/login" />;
const AdminRoute = ({ children }) => {
  const user = getUser();
  if (!localStorage.getItem('token')) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/profile" />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="employees" element={<AdminRoute><Employees /></AdminRoute>} />
          <Route path="employees/new" element={<AdminRoute><EmployeeForm /></AdminRoute>} />
          <Route path="employees/:id" element={<AdminRoute><EmployeeDetail /></AdminRoute>} />
          <Route path="employees/:id/edit" element={<AdminRoute><EmployeeForm /></AdminRoute>} />
          <Route path="attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
          <Route path="salary" element={<AdminRoute><Salary /></AdminRoute>} />
          <Route path="vacation" element={<AdminRoute><Vacation /></AdminRoute>} />
          <Route path="requests" element={<AdminRoute><Requests /></AdminRoute>} />
          <Route path="messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="salary-history" element={<AdminRoute><SalaryHistory /></AdminRoute>} />
          <Route path="blocked" element={<AdminRoute><BlockedEmployees /></AdminRoute>} />
          <Route path="schedule" element={<AdminRoute><Schedule /></AdminRoute>} />
          <Route path="profile" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
          <Route path="settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="my-requests" element={<PrivateRoute><Requests /></PrivateRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
