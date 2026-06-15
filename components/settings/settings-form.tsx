"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateSettings, updateProfile } from "@/actions/settings";
import { sendTestEmail } from "@/actions/email";
import type { Settings } from "@prisma/client";

interface SettingsFormProps {
  settings: Settings;
  name: string | null;
  email: string;
}

const TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Bangkok", "Asia/Tokyo", "Australia/Sydney"];
const LANGUAGES = [{ v: "en", l: "English" }, { v: "es", l: "Español" }, { v: "fr", l: "Français" }, { v: "de", l: "Deutsch" }, { v: "th", l: "ไทย" }];

export function SettingsForm({ settings, name, email }: SettingsFormProps) {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [isSending, startSending] = useTransition();
  const [profileName, setProfileName] = useState(name ?? "");
  const [state, setState] = useState({
    defaultView: settings.defaultView,
    timezone: settings.timezone,
    language: settings.language,
    browserNotifications: settings.browserNotifications,
    emailNotifications: settings.emailNotifications,
    notifyDueToday: settings.notifyDueToday,
    notifyDueTomorrow: settings.notifyDueTomorrow,
    notifyOverdue: settings.notifyOverdue,
  });

  function persist(patch: Partial<typeof state>) {
    const next = { ...state, ...patch };
    setState(next);
    startTransition(async () => {
      const res = await updateSettings({ ...patch, theme: (theme ?? "system").toUpperCase() });
      if (!res.success) toast.error(res.error);
    });
  }

  function saveProfile() {
    startTransition(async () => {
      const res = await updateProfile(profileName);
      if (res.success) toast.success("Profile updated");
      else toast.error(res.error);
    });
  }

  function testEmail() {
    startSending(async () => {
      const res = await sendTestEmail();
      if (res.success) toast.success(`Test email sent to ${email}`);
      else toast.error(res.error, { duration: 8000 });
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
          </div>
          <Button onClick={saveProfile} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance & preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(v) => { setTheme(v); persist({}); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default view</Label>
              <Select value={state.defaultView} onValueChange={(v) => persist({ defaultView: v as Settings["defaultView"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DASHBOARD">Dashboard</SelectItem>
                  <SelectItem value="LIST">Task list</SelectItem>
                  <SelectItem value="BOARD">Board</SelectItem>
                  <SelectItem value="CALENDAR">Calendar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={state.timezone} onValueChange={(v) => persist({ timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={state.language} onValueChange={(v) => persist({ language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l.v} value={l.v}>{l.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how and when TaskFlow reminds you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <ToggleRow label="Browser notifications" desc="Native reminders in your browser." checked={state.browserNotifications} onChange={(c) => persist({ browserNotifications: c })} />
          <Separator />
          <ToggleRow label="Email notifications" desc="Reminders delivered to your inbox." checked={state.emailNotifications} onChange={(c) => persist({ emailNotifications: c })} />
          <Separator />
          <ToggleRow label="Due today" checked={state.notifyDueToday} onChange={(c) => persist({ notifyDueToday: c })} />
          <ToggleRow label="Due tomorrow" checked={state.notifyDueTomorrow} onChange={(c) => persist({ notifyDueTomorrow: c })} />
          <ToggleRow label="Overdue" checked={state.notifyOverdue} onChange={(c) => persist({ notifyOverdue: c })} />
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div>
              <p className="text-sm font-medium">Send a test email</p>
              <p className="text-xs text-muted-foreground">
                Email a sample reminder to {email} to check your setup.
              </p>
            </div>
            <Button variant="outline" onClick={testEmail} disabled={isSending}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send test email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
