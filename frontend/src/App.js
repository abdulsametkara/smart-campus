import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar/Sidebar';
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
import CoursesListPage from './pages/CoursesListPage';
import CourseFormPage from './pages/CourseFormPage';
import SectionsListPage from './pages/SectionsListPage';
import SectionDetailPage from './pages/SectionDetailPage';
import SectionFormPage from './pages/SectionFormPage';
import SchedulePage from './pages/SchedulePage';

import NotFoundPage from './pages/NotFoundPage';
import InstructorAttendancePage from './pages/attendance/InstructorAttendancePage';
import StudentAttendancePage from './pages/attendance/StudentAttendancePage';
import MyAttendancePage from './pages/attendance/MyAttendancePage';
import AttendanceReportPage from './pages/attendance/AttendanceReportPage';
import ExcuseRequestPage from './pages/attendance/ExcuseRequestPage';
import ExcuseManagementPage from './pages/attendance/ExcuseManagementPage';
import AttendanceHistoryPage from './pages/attendance/AttendanceHistoryPage';
import SessionHistoryPage from './pages/attendance/SessionHistoryPage';
import StudentGradesPage from './pages/StudentGradesPage';
import InstructorGradesPage from './pages/InstructorGradesPage';
import AnnouncementManagementPage from './pages/AnnouncementManagementPage';
import AdvisorApprovalPage from './pages/AdvisorApprovalPage';
import MyAdviseesPage from './pages/MyAdviseesPage';
import './App.css';

// Mobile Header Component
function MobileHeader({ onMenuClick }) {
  return (
    <header className="mobile-header">
      <button className="mobile-menu-btn" onClick={onMenuClick}>
        ☰
      </button>
      <Link to="/dashboard" className="mobile-brand">
        <span className="brand-text">Campy</span>
      </Link>
      <div className="mobile-header-spacer"></div>
    </header>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Check if current route is a public route (no sidebar needed)
  const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicPaths.some(path => location.pathname.startsWith(path));

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app-shell public" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Yükleniyor...</div>
      </div>
    );
  }

  // For public routes or no user, don't show sidebar
  if (!user || isPublicRoute) {
    return (
      <div className="app-shell public">
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell with-sidebar">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <MobileHeader onMenuClick={toggleSidebar} />
      <div className="app-main">
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />

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

            {/* Courses Routes */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CoursesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/new"
              element={
                <ProtectedRoute roles={['admin']}>
                  <CourseFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/edit"
              element={
                <ProtectedRoute roles={['admin']}>
                  <CourseFormPage />
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
              path="/schedule"
              element={
                <ProtectedRoute>
                  <SchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grades/my"
              element={
                <ProtectedRoute roles={['student']}>
                  <StudentGradesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grades/manage"
              element={
                <ProtectedRoute roles={['faculty', 'admin']}>
                  <InstructorGradesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements/manage"
              element={
                <ProtectedRoute roles={['faculty', 'admin']}>
                  <AnnouncementManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/advisor/approvals"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <AdvisorApprovalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/advisor/students"
              element={
                <ProtectedRoute roles={['faculty']}>
                  <MyAdviseesPage />
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
            <Route
              path="/attendance/history"
              element={
                <ProtectedRoute roles={['student']}>
                  <AttendanceHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/sessions"
              element={
                <ProtectedRoute roles={['faculty', 'admin']}>
                  <SessionHistoryPage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
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