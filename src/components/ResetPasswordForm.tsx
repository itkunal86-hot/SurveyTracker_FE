import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gauge, Lock, Loader2, CheckCircle } from "lucide-react";
import { MakeInIndiaLogo } from "@/components/MakeInIndiaLogo";
import { apiClient } from "@/lib/api";

interface ResetPasswordFormProps {
  email?: string;
  token?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ResetPasswordForm = ({ 
  email: initialEmail = "", 
  token: initialToken = "",
  onSuccess,
  onCancel 
}: ResetPasswordFormProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !token || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword: newPassword,
      });

      if (response.status_code === 200) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        setError(response.message || "Password reset failed");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError("Password reset failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-panel relative">
        <div className="absolute bottom-8 left-8 z-10">
          <MakeInIndiaLogo size={120} className="relative" />
        </div>

        <div className="w-full max-w-md p-6 z-20 relative">
          <Card className="shadow-xl border-border/50">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-success rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-success-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-success">
                  Password Reset Complete
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your password has been successfully reset. You can now sign in with your new password.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={onSuccess}
                variant="default"
                className="w-full h-11"
              >
                Continue to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-panel relative">
      <div className="absolute bottom-8 left-8 z-10">
        <MakeInIndiaLogo size={120} className="relative" />
      </div>

      <div className="w-full max-w-md p-6 z-20 relative">
        <Card className="shadow-xl border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-pipeline rounded-full flex items-center justify-center shadow-lg">
              <Gauge className="w-8 h-8 text-pipeline-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-pipeline">
                Reset Your Password
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your email, reset token, and new password to complete the reset process.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  disabled={!!initialEmail}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Reset Token</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Enter the reset token from your email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="h-11"
                  disabled={!!initialToken}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 pr-10"
                  />
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {error && (
                <Alert className="border-destructive/50 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                variant="pipeline"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>

              {onCancel && (
                <div className="text-center text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-saffron hover:text-saffron/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-2">Instructions:</p>
              <p>1. Check your email for the reset token</p>
              <p>2. Enter the token exactly as received</p>
              <p>3. Choose a strong password (6+ characters)</p>
              <p className="text-xs mt-2 opacity-70">Tokens expire after 1 hour</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
