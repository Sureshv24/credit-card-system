import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Cards from "./pages/Cards";
import Payments from "./pages/Payments";
import Transactions from "./pages/Transactions";
import AdminDashboard from "./pages/AdminDashboard";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* ================================================= */}
      {/* DEFAULT */}
      {/* ================================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* ================================================= */}
      {/* AUTH */}
      {/* ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* ================================================= */}
      {/* USER DASHBOARD */}
      {/* ================================================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ================================================= */}
      {/* CARDS */}
      {/* ================================================= */}

      <Route
        path="/cards"
        element={
          <ProtectedRoute>
            <Cards />
          </ProtectedRoute>
        }
      />

      {/* ================================================= */}
      {/* PAYMENTS */}
      {/* ================================================= */}

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Payments />
          </ProtectedRoute>
        }
      />

      {/* ================================================= */}
      {/* TRANSACTIONS */}
      {/* ================================================= */}

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />

      {/* ================================================= */}
      {/* ADMIN DASHBOARD */}
      {/* ================================================= */}

      {/*
        IMPORTANT:
        AdminDashboard handles its own authentication check.

        We intentionally do NOT wrap this route with
        ProtectedRoute because that was causing the
        /admin-dashboard -> /login redirect problem.

        The actual admin APIs are still protected by Django
        IsAdminUser on the backend.
      */}

      <Route
        path="/admin-dashboard"
        element={<AdminDashboard />}
      />

      {/* ================================================= */}
      {/* UNKNOWN ROUTES */}
      {/* ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;