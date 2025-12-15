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
          <Link to="/courses" className="nav-link">Dersler</Link>
          <Link to="/sections" className="nav-link">Sections</Link>
          {user.role !== 'admin' && <Link to="/schedule" className="nav-link">Ders Programı</Link>}

          {/* Öğrenci Menüsü */}
          {user.role === 'student' && (
            <>
              <Link to="/attendance/student" className="nav-link">Yoklama</Link>
              <Link to="/attendance/my-stats" className="nav-link">Devamsızlığım</Link>
              <Link to="/attendance/history" className="nav-link">Geçmiş</Link>
              <Link to="/grades/my" className="nav-link">Notlar</Link>
              <Link to="/attendance/excuses/new" className="nav-link">Mazeret</Link>
            </>
          )}

          {/* Hoca Menüsü */}
          {user.role === 'faculty' && (
            <>
              <Link to="/attendance/instructor" className="nav-link">Yoklama</Link>
              <Link to="/attendance/report" className="nav-link">Rapor</Link>
              <Link to="/attendance/sessions" className="nav-link">Geçmiş</Link>
              <Link to="/grades/manage" className="nav-link">Not Girişi</Link>
              <Link to="/advisor/approvals" className="nav-link">Ders Onay</Link>
              <Link to="/advisor/students" className="nav-link">Danışman</Link>
              <Link to="/announcements/manage" className="nav-link">Duyurular</Link>
              <Link to="/attendance/excuses/manage" className="nav-link">Mazeretler</Link>
            </>
          )}

          {/* Admin Menüsü */}
          {user.role === 'admin' && (
            <>
              <Link to="/admin/users" className="nav-link">Kullanıcılar</Link>
              <Link to="/admin/logs" className="nav-link">Loglar</Link>
              <Link to="/admin/academic" className="nav-link">Akademik</Link>
              <Link to="/announcements/manage" className="nav-link">Duyurular</Link>
            </>
          )}

          <Link to="/profile" className="nav-link">Profil</Link>
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
    </div >
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