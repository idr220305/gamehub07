import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../lib/session.js";

// Wraps protected pages — if no session, bounce to home.
// `useSession` re-renders the moment the user signs out, so any route
// rendered behind this guard will immediately unmount on sign-out.
export default function RequireAuth({ children }) {
  const user = useSession();
  const location = useLocation();
  if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return children;
}
