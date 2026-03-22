const CONFIG_KEY = "carpool-api-url";

export function getApiUrl(): string | null {
  return localStorage.getItem(CONFIG_KEY);
}

export function setApiUrl(url: string) {
  localStorage.setItem(CONFIG_KEY, url.trim());
}

export function clearApiUrl() {
  localStorage.removeItem(CONFIG_KEY);
}

export function isGoogleSheetsMode(): boolean {
  return !!getApiUrl();
}
