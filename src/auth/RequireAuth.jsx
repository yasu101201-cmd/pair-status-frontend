import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}
