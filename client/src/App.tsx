import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import { PatientDashboard, DoctorDashboard, AdminDashboard } from './pages/Dashboards';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminLayout from './components/AdminLayout';
import AdminDoctorsList from './pages/AdminDoctorsList';
import AdminDoctorCreate from './pages/AdminDoctorCreate';
import AdminDoctorDetail from './pages/AdminDoctorDetail';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Patient & Doctor Routes */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        
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
