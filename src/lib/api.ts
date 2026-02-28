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

  async updateProfile(data: { phoneNumber?: string }) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any)?.error || (err as any)?.message || 'Failed to update profile');
    }
    return response.json();
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

  // Training courses (MongoDB)
  async getCourses(params?: { page?: number; limit?: number; sort?: string; createdBy?: string }) {
    const headers = await this.getAuthHeaders();
    const searchParams = new URLSearchParams();
    if (params?.page != null) searchParams.set('page', String(params.page));
    if (params?.limit != null) searchParams.set('limit', String(params.limit));
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.createdBy) searchParams.set('createdBy', params.createdBy);
    const query = searchParams.toString();
    const url = query ? `${API_BASE_URL}/courses?${query}` : `${API_BASE_URL}/courses`;
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const msg = (error as any).error || (error as any).message;
      if (response.status === 404) {
        throw new Error(
          msg ? `Courses API not found (404). ${msg}` : 'Courses API not found (404). Is the backend running and restarted after adding /api/courses?'
        );
      }
      throw new Error(msg || `Failed to fetch courses (${response.status})`);
    }
    return response.json();
  }

  async getCourseById(id: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, { method: 'GET', headers });
    if (!response.ok) {
      if (response.status === 404) return null;
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to fetch course');
    }
    return response.json();
  }

  async createCourse(payload: { courseTitle: string; description?: string; level?: "basic" | "advanced"; badges?: string[]; modules: any[] }) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to create course');
    }
    return response.json();
  }

  async updateCourse(courseId: string, payload: { courseTitle: string; description?: string; level?: "basic" | "advanced"; badges?: string[]; modules: any[] }) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to update course');
    }
    return response.json();
  }

  async deleteCourse(courseId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, { method: 'DELETE', headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to delete course');
    }
    return response.json();
  }

  async getCourseProgress(courseId: string): Promise<{ completed: string[] }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/progress`, { method: 'GET', headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to fetch progress');
    }
    const data = await response.json();
    return { completed: data.completed ?? [] };
  }

  async markCourseProgressComplete(courseId: string, submoduleId: string): Promise<{ completed: string[]; certificateGenerated?: boolean }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/progress`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ submoduleId }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to update progress');
    }
    return response.json();
  }

  async unmarkCourseProgressComplete(courseId: string, submoduleId: string): Promise<{ completed: string[] }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/progress`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ submoduleId }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to update progress');
    }
    return response.json();
  }

  /** Get activity email telemetry status (opened, clicked, credentials) for Pass/Fail display. */
  async getActivityEmailStatus(courseId: string, submoduleId: string): Promise<{
    success: boolean;
    hasEmail?: boolean;
    passed?: boolean | null;
    openedAt?: string | null;
    clickedAt?: string | null;
    credentialsEnteredAt?: string | null;
  }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${API_BASE_URL}/courses/${courseId}/progress/activity-email-status?submoduleId=${encodeURIComponent(submoduleId)}`,
      { method: "GET", headers }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((data as any).error || "Failed to fetch activity status");
    return data;
  }

  /** Send the Dropbox training activity email to the given address. submoduleId (e.g. "0-activity") links the email for pass/fail check. */
  async sendActivityEmail(
    courseId: string,
    to: string,
    submoduleId: string
  ): Promise<{ success: boolean; message?: string; emailSentAt?: string; timeLimitMinutes?: number }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/activity/send-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to: to.trim(), submoduleId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data as any).error || 'Failed to send activity email');
    }
    return data;
  }

  /** Send the WhatsApp Verification template to the given phone number (training activity) */
  async sendActivityWhatsApp(courseId: string, to: string): Promise<{ success: boolean; message?: string }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/activity/send-whatsapp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to: to.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data as any).error || 'Failed to send WhatsApp message');
    }
    return data;
  }

  // Certificate methods
  async getUserCertificates(): Promise<{ certificates: any[] }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/certificates`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to fetch certificates');
    }
    const data = await response.json();
    return { certificates: data.certificates ?? [] };
  }

  async getCertificateById(certificateId: string): Promise<{ certificate: any }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/certificates/${certificateId}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to fetch certificate');
    }
    const data = await response.json();
    return { certificate: data.certificate };
  }

  async getCertificateByCourse(courseId: string): Promise<{ certificate: any | null }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/certificates/course/${courseId}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to fetch certificate');
    }
    const data = await response.json();
    return { certificate: data.certificate ?? null };
  }

  async generateCertificate(courseId: string): Promise<{ certificate: any }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/certificates/generate/${courseId}`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any).error || 'Failed to generate certificate');
    }
    const data = await response.json();
    return { certificate: data.certificate };
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