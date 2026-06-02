import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EnquiriesPage from '@/pages/EnquiriesPage';
import EnquiryFormPage from '@/pages/EnquiryFormPage';
import StudentsPage from '@/pages/StudentsPage';
import StudentFormPage from '@/pages/StudentFormPage';
import StudentDetailPage from '@/pages/StudentDetailPage';
import CabinsPage from '@/pages/CabinsPage';
import PaymentsPage from '@/pages/PaymentsPage';
import ReportsPage from '@/pages/ReportsPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import PlaceholderPage from '@/pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/enquiries" element={<EnquiriesPage />} />
              <Route path="/enquiries/new" element={<EnquiryFormPage />} />
              <Route path="/enquiries/:id/edit" element={<EnquiryFormPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/students/new" element={<StudentFormPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
              <Route path="/students/:id/edit" element={<StudentFormPage />} />
              <Route path="/cabins" element={<CabinsPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
