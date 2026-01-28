// App.jsx or main router file
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./Routes/ProtectedRoute";
import PublicRoute from "./Routes/PublicRoute";
import Dashboard from "./modules/Dashboard/Dashboard.jsx";
import Form from "./modules/Form/Form.jsx";

function App() {
  return (
    
      <Routes>
        {/* ✅ Protected Routes - Need authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ Public Routes - Redirect if already logged in */}
        <Route
          path="/users/sign-in"
          element={
            <PublicRoute>
              <Form isSignInPage={true} />
            </PublicRoute>
          }
        />

        <Route
          path="/users/sign-up"
          element={
            <PublicRoute>
              <Form isSignInPage={false} />
            </PublicRoute>
          }
        />

        {/* ✅ 404 Page */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    
  );
}

export default App;