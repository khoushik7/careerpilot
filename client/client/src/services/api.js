/**
 * Central API Client for Smart Career Coach
 * Supports production public backend URL via VITE_API_URL or local Vite proxy fallback (/api)
 */
const rawBaseURL = import.meta.env.VITE_API_URL || '';
const cleanBaseURL = rawBaseURL.trim().replace(/\/+$/, '');
export const API_BASE = cleanBaseURL ? `${cleanBaseURL}/api` : '/api';

export async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${API_BASE}${normalizedEndpoint}`;

  let response;
  try {
    response = await fetch(targetUrl, options);
  } catch (netErr) {
    throw new Error(`Unable to reach the server at ${targetUrl}. Please ensure the backend is running and online.`);
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: text || response.statusText };
    }
  }

  if (!response.ok) {
    const errorMsg = (data && data.error) 
      ? data.error 
      : (data && data.message)
      ? data.message
      : `Server request failed with status ${response.status} (${response.statusText || 'Backend server error'})`;
    throw new Error(errorMsg);
  }

  return data;
}
