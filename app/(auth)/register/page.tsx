"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { registerAction } from "@/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth-submit-button";
import type { ActionResult } from "@/types";

export default function RegisterPage() {
  const [state, formAction] = useActionState<
    ActionResult<{ needsVerification: boolean }> | null,
    FormData
  >(registerAction, null);

  if (state?.success && state.data.needsVerification) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent you a verification link. Click it to activate your account, then log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="block text-center text-sm text-primary hover:underline">
            Back to log in
          </Link>
        </CardContent>
      </Card>
    );
  }

  const fe = state && !state.success ? state.fieldErrors : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Start organizing your work in minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Ada Lovelace" />
            {fe?.name && <p className="text-xs text-destructive">{fe.name[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
            {fe?.email && <p className="text-xs text-destructive">{fe.email[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required />
            {fe?.password && <p className="text-xs text-destructive">{fe.password[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
            {fe?.confirmPassword && <p className="text-xs text-destructive">{fe.confirmPassword[0]}</p>}
          </div>

          {state && !state.success && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <SubmitButton>Create account</SubmitButton>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
