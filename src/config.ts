// --- src/config.ts ---
// THIS FILE IS PUBLIC AND COMMITTED TO GITHUB.

// It imports the secrets. If the file doesn't exist, it uses empty strings.
import * as secrets from './secrets.js';

export const GIST_ID = secrets.GIST_ID || "";
export const GITHUB_PAT = secrets.GITHUB_PAT || "";
export const FILENAME = 'appState.json'; // This can live here, it's not a secret

// This check is important for anyone else who clones your repo.
if (!GIST_ID || !GITHUB_PAT) {
    alert("CRITICAL ERROR: Secrets for Gist ID or GitHub PAT are not set. Please create a src/secrets.ts file.");
}