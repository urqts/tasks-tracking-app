import { requireUser } from "@/lib/auth";
import { getSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, preferences and notifications.</p>
      </div>
      <SettingsForm settings={settings} name={user.name} email={user.email} />
    </div>
  );
}
