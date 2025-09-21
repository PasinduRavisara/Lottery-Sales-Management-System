import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SalesForm from "./pages/SalesForm";
import Reports from "./pages/Reports";
import Submission from "./pages/Submission";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gray-950">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-100">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/sales-form"
        element={
          isAuthenticated ? <SalesForm /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/reports"
        element={
          isAuthenticated ? <Reports /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/submission"
        element={
          isAuthenticated ? <Submission /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/user-management"
        element={
          isAuthenticated ? (
            <UserManagement />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/profile"
        element={
          isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default App;
