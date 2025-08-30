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
import { Gauge, Lock, Loader2 } from "lucide-react";
import { MakeInIndiaLogo } from "@/components/MakeInIndiaLogo";
import { apiClient } from "@/lib/api";

interface LoginFormProps {
  onLogin: (role: "admin" | "manager" | "survey") => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.loginUser({
        email: email.trim(),
        password: password,
      });

      if (response.status_code === 200 && response.data) {
        const user = response.data;

        let appRole: "admin" | "manager" | "survey";
        switch (user.role) {
          case "ADMIN":
            appRole = "admin";
            break;
          case "MANAGER":
            appRole = "manager";
            break;
          case "SURVEY_MANAGER":
            appRole = "survey";
            break;
          default:
            appRole = "survey";
        }

        sessionStorage.setItem("currentUser", JSON.stringify(user));

        onLogin(appRole);
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.forgotPassword({
        email: email.trim(),
      });

      if (response.status_code === 200) {
        setSuccess(response.message);
        setIsForgotPassword(false);
      } else {
        setError(response.message || "Failed to send reset instructions");
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      setError("Failed to send reset instructions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
                {isForgotPassword ? "Reset Password" : "AltGeo Survey Dashboard"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {isForgotPassword
                  ? "Enter your email to receive reset instructions"
                  : "Real-time monitoring and mapping system"}
                {!isForgotPassword && (
                  <span className="block text-xs mt-1 text-saffron font-medium">
                    🇮🇳 Make in India Initiative
                  </span>
                )}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                    />
                    <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              )}

              {error && (
                <Alert className="border-destructive/50 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-success/50 text-success">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                variant="pipeline"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading
                  ? (isForgotPassword ? "Sending..." : "Signing in...")
                  : (isForgotPassword ? "Send Reset Instructions" : "Sign In")}
              </Button>

              <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                {isForgotPassword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError("");
                      setSuccess("");
                    }}
                    className="text-saffron hover:text-saffron/80 transition-colors"
                  >
                    Back to Sign In
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError("");
                      setSuccess("");
                    }}
                    className="text-saffron hover:text-saffron/80 transition-colors"
                  >
                    Forgot your password?
                  </button>
                )}

              </div>
            </form>

            {!isForgotPassword && (
              <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-2">Demo Credentials:</p>
                <p>Admin: john.smith@company.com / password123</p>
                <p>Manager: sarah.johnson@company.com / password123</p>
                <p>Survey Manager: mike.wilson@company.com / password123</p>
                <p className="text-xs mt-2 opacity-70">Note: Any password works in demo mode</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
