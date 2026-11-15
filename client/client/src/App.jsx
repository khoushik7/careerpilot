import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import DogAIAssistant from './components/DogAIAssistant';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const MockInterview = React.lazy(() => import('./pages/MockInterview'));
const TechnicalPrep = React.lazy(() => import('./pages/TechnicalPrep'));
const AptitudePrep = React.lazy(() => import('./pages/AptitudePrep'));
const ResumeAnalyzer = React.lazy(() => import('./pages/ResumeAnalyzer'));
const CompanyPrep = React.lazy(() => import('./pages/CompanyPrep'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const DailyChallenge = React.lazy(() => import('./pages/DailyChallenge'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

/* ── Guards ──────────────────────────────────────────────────────────── */

/** Redirect unauthenticated users to /login */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Redirect non-admin users away from admin routes */
function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

/* ── Shell (shown only when logged in) ──────────────────────────────── */
function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <DogAIAssistant />
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>🎓 CareerPilot — AI-Powered Mock Interview &amp; Placement Preparation Platform</p>
      </footer>
    </div>
  );
}

/* ── App ─────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <React.Suspense
            fallback={
              <div
                className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400"
                role="status"
              >
                Loading page...
              </div>
            }
          >
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected routes — wrapped in AppShell */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppShell><Dashboard /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mock-interview"
                element={
                  <ProtectedRoute>
                    <AppShell><MockInterview /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/technical-prep"
                element={
                  <ProtectedRoute>
                    <AppShell><TechnicalPrep /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aptitude-prep"
                element={
                  <ProtectedRoute>
                    <AppShell><AptitudePrep /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume-analyzer"
                element={
                  <ProtectedRoute>
                    <AppShell><ResumeAnalyzer /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company-prep"
                element={
                  <ProtectedRoute>
                    <AppShell><CompanyPrep /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <AppShell><Leaderboard /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/daily-challenge"
                element={
                  <ProtectedRoute>
                    <AppShell><DailyChallenge /></AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AppShell><AdminDashboard /></AppShell>
                  </ProtectedAdminRoute>
                }
              />

              {/* Catch-all — redirect to dashboard (or login if not authed) */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}