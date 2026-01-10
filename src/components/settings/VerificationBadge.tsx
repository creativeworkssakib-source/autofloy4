import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationBadgeProps {
  isVerified: boolean;
  type: "email" | "phone";
  onVerify: () => Promise<void>;
}

export function VerificationBadge({ isVerified, type, onVerify }: VerificationBadgeProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await onVerify();
      toast({
        title: "Verification Sent",
        description: `A verification ${type === "email" ? "email" : "SMS"} has been sent. Please check your ${type}.`,
      });
    } catch (error) {
      toast({
        title: "Failed to Send Verification",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Badge variant="outline" className="text-success border-success/30 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1">
        <XCircle className="h-3 w-3" />
        Unverified
      </Badge>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs text-primary"
        onClick={handleVerify}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : null}
        Verify now
      </Button>
    </div>
  );
}
