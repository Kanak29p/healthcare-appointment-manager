import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import { DoctorDashboard, AdminDashboard } from './pages/Dashboards';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AdminDoctorsList from './pages/AdminDoctorsList';
import AdminDoctorCreate from './pages/AdminDoctorCreate';
import AdminDoctorDetail from './pages/AdminDoctorDetail';

// Patient Imports
import PatientLayout from './components/PatientLayout';
import PatientDoctors from './pages/PatientDoctors';
import PatientDoctorDetail from './pages/PatientDoctorDetail';
import PatientBook from './pages/PatientBook';
import PatientAppointments from './pages/PatientAppointments';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Patient & Doctor Dashboards */}
        <Route path="/patient/dashboard" element={<Navigate to="/patient/doctors" replace />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        
        {/* Patient Portal Routes */}
        <Route element={<PatientLayout />}>
          <Route path="/patient/doctors" element={<PatientDoctors />} />
          <Route path="/patient/doctors/:id" element={<PatientDoctorDetail />} />
          <Route path="/patient/book/:doctorId" element={<PatientBook />} />
          <Route path="/patient/appointments" element={<PatientAppointments />} />
        </Route>

        {/* Admin Dashboard Protected Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/doctors" element={<AdminDoctorsList />} />
            <Route path="/admin/doctors/create" element={<AdminDoctorCreate />} />
            <Route path="/admin/doctors/:id" element={<AdminDoctorDetail />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
