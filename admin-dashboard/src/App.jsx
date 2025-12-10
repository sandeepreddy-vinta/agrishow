import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import AuthGuard, { GuestGuard } from './components/AuthGuard';
import Layout from './components/Layout';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const ContentLibrary = lazy(() => import('./components/ContentLibrary'));
const FranchiseManager = lazy(() => import('./components/FranchiseManager'));
const AssignmentManager = lazy(() => import('./components/AssignmentManager'));
const Analytics = lazy(() => import('./components/Analytics'));
const Settings = lazy(() => import('./components/Settings'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const Scheduler = lazy(() => import('./components/Scheduler'));
const RealtimeMonitor = lazy(() => import('./components/RealtimeMonitor'));
const BulkUploader = lazy(() => import('./components/BulkUploader'));
const ContentEditor = lazy(() => import('./components/ContentEditor'));

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background text-primary">
    <Loader2 size={48} className="animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-surface text-white border border-white/10',
            style: {
              background: '#1e293b',
              color: '#fff',
            },
          }}
        />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public route - redirect to dashboard if already logged in */}
            <Route 
              path="/login" 
              element={
                <GuestGuard>
                  <LoginPage />
                </GuestGuard>
              } 
            />

            {/* Protected routes - require authentication */}
            <Route 
              element={
                <AuthGuard>
                  <Layout />
                </AuthGuard>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/scheduler" element={<Scheduler />} />
              <Route path="/live" element={<RealtimeMonitor />} />
              <Route path="/content" element={<ContentLibrary />} />
              <Route path="/editor" element={<ContentEditor />} />
              <Route path="/franchises" element={<FranchiseManager />} />
              <Route path="/assignments" element={<AssignmentManager />} />
              <Route path="/bulk" element={<BulkUploader />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
