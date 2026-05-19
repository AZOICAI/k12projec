import { useEffect, useState } from "react";
import { apiPaths, fullUrl } from "@k12/shared";
import { signInWithPassword, signOut } from "../lib/supabase-auth";
import { getSession, getSettings, setSettings } from "../lib/storage";

const defaults = {
  appUrl: import.meta.env.VITE_APP_URL ?? "",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
};

export function OptionsApp() {
  const [settings, setSettingsState] = useState(defaults);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      let saved = await getSettings();
      if (!saved && defaults.supabaseUrl && defaults.supabaseAnonKey) {
        await setSettings(defaults);
        saved = defaults;
      }
      if (saved) setSettingsState({ ...defaults, ...saved });
      const session = await getSession();
      setSignedIn(!!session?.access_token);
      setLoading(false);
    })();
  }, []);

  async function saveSettings(e) {
    e.preventDefault();
    setMessage(null);
    await setSettings(settings);
    setMessage("Settings saved.");
  }

  async function onSignIn(e) {
    e.preventDefault();
    setMessage(null);
    try {
      await setSettings(settings);
      await signInWithPassword(settings, email, password);
      setSignedIn(true);
      setMessage("Signed in. You can use the popup to add assignments.");

      const session = await getSession();
      if (session?.access_token) {
        const res = await fetch(fullUrl(settings.appUrl, apiPaths.extensionSession), {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          setMessage("Signed in, but could not verify API connection. Check App URL.");
        }
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  async function onSignOut() {
    await signOut();
    setSignedIn(false);
    setMessage("Signed out.");
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div className="options">
      <h1>K12 Planner extension</h1>
      <p className="muted">
        Use the same email and password as the web app. Set your live site URL (e.g. your Vercel
        domain) in Connection below.
      </p>

      <form onSubmit={saveSettings} className="form section">
        <h2>Connection</h2>
        <label>
          App URL
          <input
            value={settings.appUrl}
            onChange={(e) => setSettingsState((s) => ({ ...s, appUrl: e.target.value }))}
            placeholder="https://your-app.vercel.app"
            required
          />
        </label>
        <label>
          Supabase URL
          <input
            value={settings.supabaseUrl}
            onChange={(e) => setSettingsState((s) => ({ ...s, supabaseUrl: e.target.value }))}
            placeholder="https://xxxx.supabase.co"
            required
          />
        </label>
        <label>
          Supabase anon key
          <input
            value={settings.supabaseAnonKey}
            onChange={(e) => setSettingsState((s) => ({ ...s, supabaseAnonKey: e.target.value }))}
            required
          />
        </label>
        <label className="row">
          <input
            type="checkbox"
            checked={!!settings.extensionNotificationsEnabled}
            onChange={(e) =>
              setSettingsState((s) => ({
                ...s,
                extensionNotificationsEnabled: e.target.checked,
              }))
            }
          />
          Chrome notifications when assignments are due soon
        </label>
        <button type="submit">Save settings</button>
      </form>

      <form onSubmit={onSignIn} className="form section">
        <h2>Sign in</h2>
        {signedIn ? (
          <p className="ok">Signed in.</p>
        ) : (
          <>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit">Sign in</button>
          </>
        )}
        {signedIn ? (
          <button type="button" className="secondary" onClick={() => void onSignOut()}>
            Sign out
          </button>
        ) : null}
      </form>

      {message ? <p className={message.includes("failed") ? "error" : "ok"}>{message}</p> : null}

      <p className="muted small">
        Before publishing to the Chrome Web Store, add your production App URL to{" "}
        <code>host_permissions</code> in <code>public/manifest.json</code>.
      </p>
    </div>
  );
}
