"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth-submit-button";
import type { ActionResult } from "@/types";

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState<ActionResult<null> | null, FormData>(
    resetPasswordAction,
    null,
  );
  const fe = state && !state.success ? state.fieldErrors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password you don&apos;t use elsewhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required />
            {fe?.password && <p className="text-xs text-destructive">{fe.password[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
            {fe?.confirmPassword && <p className="text-xs text-destructive">{fe.confirmPassword[0]}</p>}
          </div>
          {state && !state.success && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}
          <SubmitButton>Update password</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
