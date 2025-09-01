"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/app/components/Popover";
import { signOut } from "next-auth/react";

type UserData = {
  username: string;
  email: string;
  role?: string;
  companyName?: string;
  BTWNumber?: string;
  KVKNumber?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phoneNumber?: string;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<UserData>({ username: "", email: "" });
  const [newPassword, setNewPassword] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setError(null);
      setSuccess(null);
      try {
        const res = await fetch("/api/account");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Kon gegevens niet laden");
        setForm({
          username: data.username ?? "",
          email: data.email ?? "",
          role: data.role,
          companyName: data.companyName ?? "",
          BTWNumber: data.BTWNumber ?? "",
          KVKNumber: data.KVKNumber ?? "",
          postalCode: data.postalCode ?? "",
          city: data.city ?? "",
          country: data.country ?? "",
          phoneNumber: data.phoneNumber ?? "",
        });
        if (data.image) setImagePreview(data.image);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: any = { ...form };
      if (newPassword) payload.newPassword = newPassword;
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Opslaan mislukt");
      setSuccess("Instellingen opgeslagen");
      setNewPassword("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="relative rounded-2xl border border-white/20 p-6 shadow-lg bg-white/10 backdrop-blur-xl">
      <h1 className="text-2xl font-semibold mb-4 text-white">Account & Facturatie</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        {error && <p className="text-sm text-red-300">{error}</p>}
        {success && <p className="text-sm text-green-300">{success}</p>}

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={imagePreview || undefined} alt={form.username} />
            <AvatarFallback>{(form.username || 'U').split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Profielfoto</label>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm cursor-pointer hover:bg-muted/50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const preview = URL.createObjectURL(file);
                    setImagePreview(preview);
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch('/api/account/photo', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (res.ok && data.image) {
                      setImagePreview(data.image);
                    }
                  }}
                />
                <span>Bestand kiezen</span>
              </label>
              <Button type="button" variant="ghost" onClick={async () => {
                const res = await fetch('/api/account/photo', { method: 'DELETE' });
                if (res.ok) setImagePreview(null);
              }}>Verwijderen</Button>
            </div>
            <p className="text-xs text-muted-foreground">Kies een foto of verwijder</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-white/90" htmlFor="username">Gebruikersnaam</label>
            <Input id="username" name="username" value={form.username} onChange={onChange} placeholder="Voer je gebruikersnaam in" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/90" htmlFor="email">E-mail</label>
            <Input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="voer@email.adres.in" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 text-white/90" htmlFor="newPassword">Nieuw wachtwoord</label>
            <Input id="newPassword" name="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Laat leeg om niet te wijzigen" />
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium mb-3">Bedrijfsinformatie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-white/90" htmlFor="companyName">Bedrijfsnaam</label>
              <Input id="companyName" name="companyName" value={form.companyName || ""} onChange={onChange} placeholder="Voer bedrijfsnaam in" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/90" htmlFor="BTWNumber">BTW-nummer</label>
              <Input id="BTWNumber" name="BTWNumber" value={form.BTWNumber || ""} onChange={onChange} placeholder="NL123456789B01" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/90" htmlFor="KVKNumber">KVK-nummer</label>
              <Input id="KVKNumber" name="KVKNumber" value={form.KVKNumber || ""} onChange={onChange} placeholder="12345678" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/90" htmlFor="phoneNumber">Telefoonnummer</label>
              <Input id="phoneNumber" name="phoneNumber" value={form.phoneNumber || ""} onChange={onChange} placeholder="+31 6 12345678" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/90" htmlFor="postalCode">Postcode</label>
              <Input id="postalCode" name="postalCode" value={form.postalCode || ""} onChange={onChange} placeholder="1234 AB" />
            </div>
            <div>
              <label className="block text-sm mb-1 text-white/90" htmlFor="city">Stad</label>
              <Input id="city" name="city" value={form.city || ""} onChange={onChange} placeholder="Amsterdam" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-white/90" htmlFor="country">Land</label>
              <Input id="country" name="country" value={form.country || ""} onChange={onChange} placeholder="Nederland" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
          <ConfirmDialog
            triggerLabel="Account verwijderen"
            title="Weet je zeker dat je je account wil verwijderen?"
            description="Dit verwijdert ook al je projecten. Deze actie kan niet ongedaan worden gemaakt."
            confirmLabel="Verwijderen"
            triggerClassName="bg-red-600 text-white hover:bg-red-700"
            confirmClassName="bg-red-600 text-white hover:bg-red-700"
            onConfirm={async () => {
              const res = await fetch('/api/account', { method: 'DELETE' });
              // Sign out via next-auth to properly clear cookies/CSRF
              await signOut({ callbackUrl: '/' });
            }}
          />
        </div>
      </form>
      </div>
    </div>
  );
}


