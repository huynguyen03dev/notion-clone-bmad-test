"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { passwordResetConfirmSchema, type PasswordResetConfirmInput } from "@/lib/auth-utils";

interface PasswordResetConfirmFormProps {
  token: string;
}

export function PasswordResetConfirmForm({ token }: PasswordResetConfirmFormProps) {
  const [formData, setFormData] = useState<PasswordResetConfirmInput>({
    token,
    password: ""
  });
  const [errors, setErrors] = useState<Partial<PasswordResetConfirmInput>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateField = (name: keyof PasswordResetConfirmInput, value: string) => {
    try {
      passwordResetConfirmSchema.pick({ [name]: true }).parse({ [name]: value });
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof Error) {
        const zodError = JSON.parse(error.message);
        setErrors(prev => ({ ...prev, [name]: zodError[0]?.message }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name as keyof PasswordResetConfirmInput, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError("");

    try {
      passwordResetConfirmSchema.parse(formData);

      const response = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/signin");
      }, 2000);

    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              Password reset successfully! Redirecting to sign in...
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set New Password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              required
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
