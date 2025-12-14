import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminLogsPage from './pages/AdminLogsPage';
import AdminAcademicPage from './pages/AdminAcademicPage';
import SectionsListPage from './pages/SectionsListPage';
import SectionDetailPage from './pages/SectionDetailPage';
import SectionFormPage from './pages/SectionFormPage';

import NotFoundPage from './pages/NotFoundPage';
import InstructorAttendancePage from './pages/attendance/InstructorAttendancePage';
import StudentAttendancePage from './pages/attendance/StudentAttendancePage';
import MyAttendancePage from './pages/attendance/MyAttendancePage';
import AttendanceReportPage from './pages/attendance/AttendanceReportPage';
import ExcuseRequestPage from './pages/attendance/ExcuseRequestPage';
import ExcuseManagementPage from './pages/attendance/ExcuseManagementPage';
import './App.css';

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="app-brand">
        Campy
      </Link>
          {user && (
        <nav className="app-nav">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/sections" className="nav-link">Ders Bölümleri</Link>
          <Link to="/profile" className="nav-link">Profil</Link>
          {user.role === 'admin' && (
            <>
              <Link to="/admin/users" className="nav-link">Kullanıcılar</Link>
              <Link to="/admin/logs" className="nav-link">Loglar</Link>
              <Link to="/admin/academic" className="nav-link">Akademik</Link>
            </>
          )}
          <button className="btn secondary btn-sm" onClick={logout} style={{ marginLeft: 8 }}>
            Çıkış
          </button>
        </nav>
      )}
    </header>
  );
}

function AppContent() {
  return (
    <div className="app-shell">
      <Header />
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLogsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/academic"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminAcademicPage />
              </ProtectedRoute>
            }
          />

          {/* Sections Routes */}
          <Route
            path="/sections"
            element={
              <ProtectedRoute>
                <SectionsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sections/new"
            element={
              <ProtectedRoute roles={['admin', 'faculty']}>
                <SectionFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sections/:id"
            element={
              <ProtectedRoute>
                <SectionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sections/:id/edit"
            element={
              <ProtectedRoute roles={['admin', 'faculty']}>
                <SectionFormPage />
              </ProtectedRoute>
            }
          />

          {/* Attendance Routes */}
          <Route
            path="/attendance/instructor"
            element={
              <ProtectedRoute roles={['faculty']}>
                <InstructorAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/report"
            element={
              <ProtectedRoute roles={['faculty']}>
                <AttendanceReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/student"
            element={
              <ProtectedRoute roles={['student']}>
                <StudentAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/my-stats"
            element={
              <ProtectedRoute roles={['student']}>
                <MyAttendancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance/excuses/new"
            element={
              <ProtectedRoute roles={['student']}>
                <ExcuseRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/excuses/manage"
            element={
              <ProtectedRoute roles={['faculty', 'admin']}>
                <ExcuseManagementPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;