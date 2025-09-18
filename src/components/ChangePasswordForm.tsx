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
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ChangePasswordFormProps {
  userEmail?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ChangePasswordForm = ({ 
  userEmail = "",
  onSuccess,
  onCancel 
}: ChangePasswordFormProps) => {
  const [email, setEmail] = useState(userEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.changePassword({
        email: email.trim(),
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      if (response.status_code === 200) {
        setSuccess("Password changed successfully. You will be logged out.");
        toast({ title: "Password changed", description: "Please log in again." });
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          try { sessionStorage.removeItem("currentUser"); } catch {}
          onSuccess?.();
          // Ensure UI returns to login screen even if parent doesn't handle logout
          try { window.location.reload(); } catch {}
        }, 1200);
      } else {
        setError(response.message || "Password change failed");
      }
    } catch (error: any) {
      console.error("Change password error:", error);
      setError("Password change failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your account password for better security
        </CardDescription>
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
              disabled={!!userEmail}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-3 h-5 w-5 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 h-5 w-5 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 h-5 w-5 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <Alert className="border-destructive/50 text-destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-success/50 text-success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1 h-11"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Changing..." : "Change Password"}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-2">Password Requirements:</p>
          <ul className="space-y-1 text-xs">
            <li>• At least 6 characters long</li>
            <li>• Must be different from current password</li>
            <li>• Use a mix of letters, numbers, and symbols</li>
            <li>• Avoid using personal information</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
