const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// API client that accepts a token from the component
export class ApiClient {
  constructor(private getToken: () => Promise<string | null>) {}

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // System Admin endpoints
  async inviteClientAdmin(email: string, orgName: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/admins/invite-client`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, orgName }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to invite client admin');
    }
    
    return response.json();
  }

  async getOrganizations() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/admins/orgs`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch organizations');
    }
    
    return response.json();
  }

  async syncUsersFromClerk(limit = 100) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/admins/sync-users?limit=${limit}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync users');
    }
    
    return response.json();
  }

  async createOrganization(name: string, description?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/admins/create-org`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, description }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create organization');
    }
    
    return response.json();
  }

  async updateOrganization(orgId: string, name: string, description?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/admins/orgs/${orgId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name, description }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update organization');
    }
    
    return response.json();
  }

  // Client Admin endpoints
  async bulkInviteUsers(orgId: string, users: Array<{email: string, displayName?: string, group?: string}>) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orgs/${orgId}/bulk-invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ users }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to bulk invite users');
    }
    
    return response.json();
  }

  async inviteSingleUser(orgId: string, email: string, displayName?: string, group?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/orgs/${orgId}/invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, displayName, group }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to invite user');
    }
    
    return response.json();
  }

  async getInviteStatus(orgId: string, page = 1, limit = 50, status?: string, group?: string) {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) params.append('status', status);
    if (group) params.append('group', group);
    
    const response = await fetch(`${API_BASE_URL}/orgs/${orgId}/invites?${params}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch invite status');
    }
    
    return response.json();
  }

  async getOrgUsers(orgId: string, page = 1, limit = 50, role?: string, status?: string, group?: string) {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    if (group) params.append('group', group);
    
    const response = await fetch(`${API_BASE_URL}/orgs/${orgId}/users?${params}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch org users');
    }
    
    return response.json();
  }

  // User endpoints
  async getUserProfile() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers,
    });

    const parseJsonSafe = async () => {
      const text = await response.text();
      if (!text) return {};
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    };
    
    if (!response.ok) {
      const error = await parseJsonSafe();
      const message = (error as any)?.error || (error as any)?.message || 'Failed to fetch user profile';
      throw new Error(message);
    }
    
    return parseJsonSafe();
  }

  async getAllUsers(page = 1, limit = 1000, status?: string) {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) params.append('status', status);
    
    const response = await fetch(`${API_BASE_URL}/users/all?${params}`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch all users');
    }
    
    return response.json();
  }
}

// Hook to create API client with Clerk token
export const useApiClient = () => {
  // This will be used in components
  if (typeof window === 'undefined') {
    // Server-side fallback
    return new ApiClient(async () => null);
  }
  
  // Client-side - we'll pass the getToken function from useAuth hook
  return (getToken: () => Promise<string | null>) => new ApiClient(getToken);
};