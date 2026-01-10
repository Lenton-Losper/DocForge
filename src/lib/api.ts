/** API client utilities for authenticated requests. */
import { supabase } from './supabase.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Get authentication headers with JWT token.
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Make an authenticated API request.
 */
async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    window.location.href = '/';
    throw new Error('Authentication required');
  }

  return response;
}

/**
 * Upload a document to the backend.
 */
export async function uploadDocument(file: File) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);
  formData.append('fileSize', file.size.toString());
  formData.append('fileType', file.type);

  // Convert file to ArrayBuffer for backend
  const arrayBuffer = await file.arrayBuffer();
  formData.append('fileBuffer', new Blob([arrayBuffer]));

  const response = await authenticatedFetch('/api/documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      // Don't set Content-Type - let browser set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return await response.json();
}

/**
 * Get all user documents.
 */
export async function getDocuments() {
  const response = await authenticatedFetch('/api/documents');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch documents');
  }

  return await response.json();
}

/**
 * Get a specific document.
 */
export async function getDocument(id: string) {
  const response = await authenticatedFetch(`/api/documents/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch document');
  }

  return await response.json();
}

/**
 * Delete a document.
 */
export async function deleteDocument(id: string) {
  const response = await authenticatedFetch(`/api/documents/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete document');
  }

  return await response.json();
}

/**
 * Connect a GitHub repository.
 */
export async function connectRepository(repoUrl: string, githubToken?: string) {
  const response = await authenticatedFetch('/api/repositories/connect', {
    method: 'POST',
    body: JSON.stringify({
      repo_url: repoUrl,
      github_token: githubToken,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to connect repository');
  }

  return await response.json();
}

/**
 * Get all user repositories.
 */
export async function getRepositories() {
  const response = await authenticatedFetch('/api/repositories');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch repositories');
  }

  return await response.json();
}
