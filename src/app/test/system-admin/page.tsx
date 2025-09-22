'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import Link from 'next/link';

interface Organization {
  _id: string;
  name: string;
  description?: string;
  clientAdminIds: string[];
  totalUsers: number;
  activeUsers: number;
  invitedUsers: number;
  createdAt: string;
}

export default function SystemAdminPanel() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Create Organization Form
  const [createOrgForm, setCreateOrgForm] = useState({
    name: '',
    description: '',
    submitting: false,
    success: false,
    error: ''
  });

  // Invite Client Admin Form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    orgId: '',
    submitting: false,
    success: false,
    error: ''
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchOrganizations();
    }
  }, [isLoaded, user]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const apiClient = new ApiClient(getToken);
      const data = await apiClient.getOrganizations();
      setOrganizations(data.organizations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setCreateOrgForm(prev => ({ ...prev, submitting: true, error: '', success: false }));
    
    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.createOrganization(createOrgForm.name, createOrgForm.description);
      setCreateOrgForm({
        name: '',
        description: '',
        submitting: false,
        success: true,
        error: ''
      });
      
      // Refresh organizations list
      fetchOrganizations();
    } catch (err) {
      setCreateOrgForm(prev => ({ 
        ...prev, 
        submitting: false, 
        error: err instanceof Error ? err.message : 'Failed to create organization'
      }));
    }
  };

  const handleInviteClientAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteForm.orgId) {
      setInviteForm(prev => ({ ...prev, error: 'Please select an organization' }));
      return;
    }

    setInviteForm(prev => ({ ...prev, submitting: true, error: '', success: false }));
    
    try {
      const apiClient = new ApiClient(getToken);
      const selectedOrg = organizations.find(org => org._id === inviteForm.orgId);
      await apiClient.inviteClientAdmin(inviteForm.email, selectedOrg?.name || '');
      setInviteForm({
        email: '',
        orgId: '',
        submitting: false,
        success: true,
        error: ''
      });
      
      // Refresh organizations list
      fetchOrganizations();
    } catch (err) {
      setInviteForm(prev => ({ 
        ...prev, 
        submitting: false, 
        error: err instanceof Error ? err.message : 'Failed to invite client admin'
      }));
    }
  };

  const handleSyncUsers = async () => {
    try {
      setSyncing(true);
      const apiClient = new ApiClient(getToken);
      const result = await apiClient.syncUsersFromClerk();
      setSyncResult(result);
    } catch (err) {
      setSyncResult({ error: err instanceof Error ? err.message : 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <Link href="/sign-in" className="text-blue-600 hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/test" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Test Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">System Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage organizations and invite client administrators</p>
        </div>

        {/* Create Organization Form */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Organization</h2>
          
          <form onSubmit={handleCreateOrganization} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={createOrgForm.name}
                  onChange={(e) => setCreateOrgForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="University Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={createOrgForm.description}
                  onChange={(e) => setCreateOrgForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Brief description of the organization"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={createOrgForm.submitting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {createOrgForm.submitting ? 'Creating Organization...' : 'Create Organization'}
            </button>
          </form>

          {createOrgForm.success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-green-800">
                ✅ Organization created successfully!
              </div>
            </div>
          )}

          {createOrgForm.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">
                ❌ <strong>Error:</strong> {createOrgForm.error}
              </div>
            </div>
          )}
        </div>

        {/* Invite Client Admin Form */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Invite Client Administrator</h2>
          
          <form onSubmit={handleInviteClientAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@university.edu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <select
                  required
                  value={inviteForm.orgId}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, orgId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {organizations.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    No organizations available. Create one first.
                  </p>
                )}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={inviteForm.submitting || organizations.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {inviteForm.submitting ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </form>

          {inviteForm.success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-green-800">
                ✅ Invitation sent successfully! The client admin will receive an email invitation.
              </div>
            </div>
          )}

          {inviteForm.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">
                ❌ <strong>Error:</strong> {inviteForm.error}
              </div>
            </div>
          )}
        </div>

        {/* User Sync Section */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">User Synchronization</h2>
          <p className="text-gray-600 mb-4">
            Manually sync users from Clerk to ensure all accounts are properly linked.
          </p>
          
          <button
            onClick={handleSyncUsers}
            disabled={syncing}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync Users from Clerk'}
          </button>

          {syncResult && (
            <div className="mt-4 bg-gray-50 border rounded-md p-4">
              <h3 className="font-medium mb-2">Sync Results:</h3>
              {syncResult.error ? (
                <div className="text-red-600">Error: {syncResult.error}</div>
              ) : (
                <div className="space-y-1 text-sm">
                  <div>Processed: {syncResult.results?.processed || 0} users</div>
                  <div>Created: {syncResult.results?.created || 0} new users</div>
                  <div>Updated: {syncResult.results?.updated || 0} existing users</div>
                  <div>Errors: {syncResult.results?.errors?.length || 0}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Organizations List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Organizations</h2>
            <button
              onClick={fetchOrganizations}
              className="text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading organizations...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invited Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.clientAdminIds.length} admin(s)</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {org.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {org.totalUsers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {org.activeUsers}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {org.invitedUsers}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {organizations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No organizations found. Create one by inviting a client admin.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
