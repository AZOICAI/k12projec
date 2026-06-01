import { useEffect, useState } from "react";
import { apiPaths, fullUrl } from "@k12/shared";
import { signInWithPassword, signOut } from "../lib/supabase-auth";
import { buildDefaultSettings, DEFAULT_APP_URL, isConfigured } from "../lib/defaults";
import { getSession, getSettings, setSettings } from "../lib/storage";

export function OptionsApp() {
  const defaults = buildDefaultSettings();
  const [settings, setSettingsState] = useState(defaults);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      let saved = await getSettings();
      if (!saved) {
        await setSettings(defaults);
        saved = defaults;
      }
      setSettingsState({ ...defaults, ...saved });
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
    if (!isConfigured(settings)) {
      setMessage("Save connection settings first (Supabase fields in Advanced if needed).");
      return;
    }
    try {
      await setSettings(settings);
      await signInWithPassword(settings, email, password);
      setSignedIn(true);
      setMessage("Signed in. Use the toolbar popup to see due work and quick-add.");

      const session = await getSession();
      if (session?.access_token) {
        const res = await fetch(fullUrl(settings.appUrl, apiPaths.extensionSession), {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          setMessage("Signed in, but could not reach the app API. Check App URL.");
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

  function openSignup() {
    chrome.tabs.create({ url: fullUrl(settings.appUrl, "/signup") });
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div className="options">
      <h1>K12 Planner extension</h1>
      <p className="muted">
        Same account as{" "}
        <a href={DEFAULT_APP_URL} target="_blank" rel="noreferrer">
          {DEFAULT_APP_URL.replace(/^https?:\/\//, "")}
        </a>
        . Save assignments from Google Classroom or quick-add from the popup.
      </p>

      <form onSubmit={saveSettings} className="form section">
        <h2>Connection</h2>
        <label>
          App URL
          <input
            value={settings.appUrl}
            onChange={(e) => setSettingsState((s) => ({ ...s, appUrl: e.target.value.trim() }))}
            placeholder="https://k12projec.vercel.app"
            required
          />
        </label>
        <button
          type="button"
          className="secondary"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? "Hide advanced" : "Advanced (Supabase)"}
        </button>
        {showAdvanced ? (
          <>
            <label>
              Supabase URL
              <input
                value={settings.supabaseUrl}
                onChange={(e) =>
                  setSettingsState((s) => ({ ...s, supabaseUrl: e.target.value.trim() }))
                }
                placeholder="https://xxxx.supabase.co"
              />
            </label>
            <label>
              Supabase anon key
              <input
                value={settings.supabaseAnonKey}
                onChange={(e) =>
                  setSettingsState((s) => ({ ...s, supabaseAnonKey: e.target.value.trim() }))
                }
              />
            </label>
            <p className="muted small">
              Developers: set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{" "}
              in <code>apps/extension/.env</code> before <code>npm run build</code> so students
              only sign in.
            </p>
          </>
        ) : (
          <p className="muted small">
            Supabase is preconfigured in the built extension when your teacher ships a release zip.
          </p>
        )}
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
          Notify when assignments are due within 48 hours
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
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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
            <p className="muted small">
              No account?{" "}
              <button type="button" className="link" onClick={openSignup}>
                Create one on the website
              </button>
            </p>
          </>
        )}
        {signedIn ? (
          <button type="button" className="secondary" onClick={() => void onSignOut()}>
            Sign out
          </button>
        ) : null}
      </form>

      {message ? <p className={message.includes("failed") ? "error" : "ok"}>{message}</p> : null}
    </div>
  );
}
