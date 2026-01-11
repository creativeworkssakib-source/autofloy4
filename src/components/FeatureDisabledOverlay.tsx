import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FeatureDisabledOverlayProps {
  featureName: string;
  description?: string;
}

export const FeatureDisabledOverlay = ({ 
  featureName, 
  description = "This feature is currently disabled by the administrator." 
}: FeatureDisabledOverlayProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md text-center p-8 space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-destructive/10">
            <Lock className="w-12 h-12 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{featureName} Unavailable</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-left text-yellow-700 dark:text-yellow-400">
            The administrator has temporarily disabled this feature. Please check back later or contact support for more information.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};
