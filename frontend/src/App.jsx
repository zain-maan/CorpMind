import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chat from "./pages/Chat";
import Documents from "./pages/Documents";
import Users from "./pages/Users";
import Branches from "./pages/Branches";
import Actions from "./pages/Actions";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route
          path="/documents"
          element={
            <ProtectedRoute allow={["SUPER_ADMIN", "BRANCH_ADMIN", "HR"]}>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allow={["SUPER_ADMIN", "BRANCH_ADMIN", "HR"]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branches"
          element={
            <ProtectedRoute allow={["SUPER_ADMIN"]}>
              <Branches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/actions"
          element={
            <ProtectedRoute allow={["BRANCH_ADMIN", "HR", "EMPLOYEE"]}>
              <Actions />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}