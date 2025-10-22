import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/AuthFeature/authService";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [step, setStep] = useState("email"); // 'email' or 'reset'
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const otpRefs = useRef([]);
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword && newPassword === confirmPassword;
  const isPasswordValid =
    hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  const resetToken = otp.join("");
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [cooldownTime]);
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);
    const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
    if (nextEmptyIndex !== -1) {
      otpRefs.current[nextEmptyIndex]?.focus();
    } else {
      otpRefs.current[5]?.focus();
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      toast.success(response.message || "Reset code sent to your email!");
      setStep("reset");
      setErrors({});
      setCooldownTime(30); // Set 30 second cooldown
    } catch (error) {
      setErrors({
        submit:
          error.response?.data?.error ||
          "Failed to send reset code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldownTime > 0) return; // Prevent resend during cooldown

    setIsResending(true);
    setErrors({});

    try {
      const response = await authService.forgotPassword(email);
      toast.success(response.message || "Reset code resent to your email!");
      setOtp(["", "", "", "", "", ""]); // Clear OTP inputs
      setCooldownTime(30); // Reset cooldown
      otpRefs.current[0]?.focus();
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error(
          error.response?.data?.error ||
            "Please wait before requesting a new code."
        );
      } else {
        toast.error("Failed to resend code. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    const isOtpEmpty = otp.every((digit) => !digit);
    if (isOtpEmpty) {
      setErrors({ otp: "Please enter the reset code" });
      return;
    }

    if (resetToken.length !== 6) {
      setErrors({ otp: "Please enter all 6 digits" });
      return;
    }

    if (!newPassword) {
      setErrors({ newPassword: "Password is required" });
      return;
    }

    if (!isPasswordValid) {
      setErrors({ newPassword: "Please meet all password requirements" });
      return;
    }

    if (!confirmPassword) {
      setErrors({ confirmPassword: "Please confirm your password" });
      return;
    }

    if (!passwordsMatch) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(
        email,
        resetToken,
        newPassword
      );
      toast.success(response.message || "Password reset successfully!");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === "email" ? (
        <form onSubmit={handleRequestReset} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              disabled={isLoading}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <p className="text-sm text-destructive text-center">
                {errors.submit}
              </p>
            </motion.div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Reset Code"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5" noValidate>
          <div className="space-y-3">
            <Label className="text-center block">Reset Code</Label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    handleOtpChange(index, e.target.value);
                    if (errors.otp) setErrors({ ...errors, otp: "" });
                  }}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  disabled={isLoading}
                  className={`w-12 h-14 text-center text-2xl font-semibold ${
                    errors.otp ? "border-destructive" : ""
                  }`}
                />
              ))}
            </div>
            {errors.otp && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive text-center"
              >
                {errors.otp}
              </motion.p>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code sent to {email}
            </p>

            {/* Resend Code Section */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <p className="text-xs text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleResendCode}
                disabled={cooldownTime > 0 || isResending}
                className="h-auto p-0 text-xs font-semibold"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : cooldownTime > 0 ? (
                  <span className="flex items-center gap-1">
                    <RotateCw className="h-3 w-3" />
                    Resend in {cooldownTime}s
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <RotateCw className="h-3 w-3" />
                    Resend code
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword)
                    setErrors({ ...errors, newPassword: "" });
                }}
                disabled={isLoading}
                className={`pr-10 ${
                  errors.newPassword ? "border-destructive" : ""
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {errors.newPassword}
              </motion.p>
            )}
          </div>

          {/* Password Requirements */}
          {newPassword && (
            <div className="space-y-1 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 text-xs">
                {hasMinLength ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-muted-foreground" />
                )}
                <span
                  className={
                    hasMinLength ? "text-green-600" : "text-muted-foreground"
                  }
                >
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {hasUpperCase ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-muted-foreground" />
                )}
                <span
                  className={
                    hasUpperCase ? "text-green-600" : "text-muted-foreground"
                  }
                >
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {hasLowerCase ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-muted-foreground" />
                )}
                <span
                  className={
                    hasLowerCase ? "text-green-600" : "text-muted-foreground"
                  }
                >
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {hasNumber ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-muted-foreground" />
                )}
                <span
                  className={
                    hasNumber ? "text-green-600" : "text-muted-foreground"
                  }
                >
                  One number
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors({ ...errors, confirmPassword: "" });
                }}
                disabled={isLoading}
                className={`pr-10 ${
                  errors.confirmPassword ? "border-destructive" : ""
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive"
              >
                {errors.confirmPassword}
              </motion.p>
            )}
            {confirmPassword && !errors.confirmPassword && (
              <div
                className={`p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-2 text-xs ${
                  passwordsMatch ? "text-green-600" : "text-destructive"
                }`}
              >
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    <span>Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <p className="text-sm text-destructive text-center">
                {errors.submit}
              </p>
            </motion.div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep("email");
                setErrors({});
              }}
              disabled={isLoading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isPasswordValid || !passwordsMatch}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
