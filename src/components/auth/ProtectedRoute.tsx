import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireEmailVerification?: boolean;
}

const ProtectedRoute = ({ children, requireEmailVerification = true }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Loading state - show spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is authenticated, allow access
  if (user) {
    // Check email verification if required
    if (requireEmailVerification && !user.emailVerified) {
      return <Navigate to="/verify-email" replace />;
    }
    return <>{children}</>;
  }

  // Not authenticated - redirect to login
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
