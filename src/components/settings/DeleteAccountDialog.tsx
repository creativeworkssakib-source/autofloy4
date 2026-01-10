import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Mail, Shield, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authService } from "@/services/authService";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

type Step = "confirm" | "otp" | "deleting";

export function DeleteAccountDialog({ open, onOpenChange, onConfirm, isLoading }: DeleteAccountDialogProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [confirmText, setConfirmText] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const isConfirmed = confirmText === "DELETE";

  const handleRequestOtp = async () => {
    if (!isConfirmed) return;
    
    setIsSendingOtp(true);
    try {
      const response = await authService.requestDeletionOtp();
      setMaskedEmail(response.email);
      setStep("otp");
      toast.success("Verification code sent to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndDelete = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setIsVerifying(true);
    try {
      await authService.confirmDeletion(otp);
      setStep("deleting");
      await onConfirm();
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
      setIsVerifying(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStep("confirm");
      setConfirmText("");
      setOtp("");
      setMaskedEmail("");
    }
    onOpenChange(open);
  };

  const handleBack = () => {
    setStep("confirm");
    setOtp("");
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Your Account
          </AlertDialogTitle>
          
          {step === "confirm" && (
            <AlertDialogDescription className="space-y-3">
              <p>
                This action is <strong>permanent and irreversible</strong>. All your data will be deleted including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Your profile and settings</li>
                <li>All connected Facebook pages</li>
                <li>All automations and their configurations</li>
                <li>Message and execution history</li>
                <li>Offline shop data (sales, products, customers)</li>
                <li>Subscription and billing data</li>
              </ul>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-3">
                <p className="text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  For security, we'll send a verification code to your email.
                </p>
              </div>
            </AlertDialogDescription>
          )}

          {step === "otp" && (
            <AlertDialogDescription className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Verification code sent to <strong>{maskedEmail}</strong></span>
              </div>
              <p className="text-sm">
                Enter the 6-digit code from your email to permanently delete your account.
              </p>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {step === "confirm" && (
          <div className="py-4">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              Type <span className="font-bold text-destructive">DELETE</span> to continue
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE"
              className="mt-2"
              disabled={isSendingOtp}
            />
          </div>
        )}

        {step === "otp" && (
          <div className="py-4 space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Code expires in 10 minutes
            </p>
          </div>
        )}

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {step === "confirm" && (
            <>
              <AlertDialogCancel disabled={isSendingOtp}>Cancel</AlertDialogCancel>
              <Button
                onClick={handleRequestOtp}
                disabled={!isConfirmed || isSendingOtp}
                variant="destructive"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={isVerifying}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleVerifyAndDelete}
                disabled={otp.length !== 6 || isVerifying}
                variant="destructive"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting Account...
                  </>
                ) : (
                  "Permanently Delete Account"
                )}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
