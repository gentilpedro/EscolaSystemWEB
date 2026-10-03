import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/Sidebar';
import { NotificationsProvider } from './components/ui/Notifications';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loading } from './components/Loading';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminSchools } from './pages/admin/Schools';
import { AdminUsers } from './pages/admin/Users';
import { AdminSettings } from './pages/admin/Settings';

// Director Pages
import { DirectorDashboard } from './pages/director/Dashboard';
import { DirectorStaff } from './pages/director/Staff';
import { DirectorClasses } from './pages/director/Classes';
import { DirectorStudents } from './pages/director/Students';
import { DirectorReports } from './pages/director/Reports';
import { DirectorDisciplinary } from './pages/director/Disciplinary';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/Dashboard';
import { TeacherAttendance } from './pages/teacher/Attendance';
import { TeacherClasses } from './pages/teacher/Classes';
import { TeacherGrades } from './pages/teacher/Grades';
import { TeacherDisciplinary } from './pages/teacher/Disciplinary';

// Orientador Pages
import { OrientadorDashboard } from './pages/orientador/Dashboard';
import { OrientadorStudents } from './pages/orientador/Students';
import { OrientadorAttendance } from './pages/orientador/Attendance';
import { OrientadorGrades } from './pages/orientador/Grades';
import { OrientadorDisciplinary } from './pages/orientador/Disciplinary';

// Parent Pages
import { ParentDashboard } from './pages/parent/Dashboard';
import { ParentDisciplinary } from './pages/parent/Disciplinary';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentGrades } from './pages/student/Grades';
import { StudentAttendance } from './pages/student/Attendance';
import { StudentAssignments } from './pages/student/Assignments';

import { UserRole } from './types';

function PrivateLayout() {
  return (
    <AppShell>
        <Routes>
          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/schools"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminSchools />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Director */}
          <Route
            path="/director"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DIRECTOR]}>
                <DirectorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/staff"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DIRECTOR]}>
                <DirectorStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/classes"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DIRECTOR]}>
                <DirectorClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/students"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DIRECTOR]}>
                <DirectorStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/reports"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DIRECTOR]}>
                <DirectorReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/disciplinary"
            element={
              <ProtectedRoute allowedRoles={[UserRole.DIRECTOR]}>
                <DirectorDisciplinary />
              </ProtectedRoute>
            }
          />

          {/* Teacher */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
                <TeacherAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classes"
            element={
              <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
                <TeacherClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/grades"
            element={
              <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
                <TeacherGrades />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/disciplinary"
            element={
              <ProtectedRoute allowedRoles={[UserRole.TEACHER]}>
                <TeacherDisciplinary />
              </ProtectedRoute>
            }
          />

          {/* Orientador */}
          <Route path="/orientador" element={<ProtectedRoute allowedRoles={[UserRole.ORIENTADOR]}><OrientadorDashboard /></ProtectedRoute>} />
          <Route path="/orientador/students" element={<ProtectedRoute allowedRoles={[UserRole.ORIENTADOR]}><OrientadorStudents /></ProtectedRoute>} />
          <Route path="/orientador/attendance" element={<ProtectedRoute allowedRoles={[UserRole.ORIENTADOR]}><OrientadorAttendance /></ProtectedRoute>} />
          <Route path="/orientador/grades" element={<ProtectedRoute allowedRoles={[UserRole.ORIENTADOR]}><OrientadorGrades /></ProtectedRoute>} />
          <Route path="/orientador/disciplinary" element={<ProtectedRoute allowedRoles={[UserRole.ORIENTADOR]}><OrientadorDisciplinary /></ProtectedRoute>} />

          {/* Parent */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARENT]}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/disciplinary"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PARENT]}>
                <ParentDisciplinary />
              </ProtectedRoute>
            }
          />

          {/* Student */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/grades"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <StudentGrades />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                <StudentAssignments />
              </ProtectedRoute>
            }
          />

          {/* Redirect padrão após login */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    </AppShell>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Privadas */}
      {isAuthenticated ? (
        <>
          <Route path="/*" element={<PrivateLayout />} />

          <Route
            path="/dashboard"
            element={<Navigate to={`/${user?.role}`} replace />}
          />
        </>
      ) : (
        <>
          <Route
            path="/admin/*"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/director/*"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/teacher/*"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/orientador/*"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/parent/*"
            element={<Navigate to="/login" replace />}
          />
          <Route
            path="/student/*"
            element={<Navigate to="/login" replace />}
          />
        </>
      )}

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationsProvider>
          <AppRoutes />
        </NotificationsProvider>
      </AuthProvider>
    </Router>
  );
}