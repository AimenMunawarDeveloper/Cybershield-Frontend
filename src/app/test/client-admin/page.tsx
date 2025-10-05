'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import Link from 'next/link';

interface User {
  _id: string;
  email: string;
  displayName: string;
  role: string;
  status: 'invited' | 'active' | 'suspended';
  groups: string[];
  points?: number;
  riskScore?: number;
  createdAt: string;
}

interface Group {
  _id: string;
  name: string;
  memberCount: number;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupMember {
  _id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
}

interface UserProfile {
  _id: string;
  orgId?: string;
  role: string;
}

export default function ClientAdminPanel() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'invites' | 'groups'>('users');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Single invite form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    submitting: false,
    success: false,
    error: ''
  });

  // Bulk invite form
  const [bulkInviteForm, setBulkInviteForm] = useState({
    users: '',
    submitting: false,
    success: false,
    error: '',
    result: null as any
  });

  // Group forms
  const [createGroupForm, setCreateGroupForm] = useState({
    name: '',
    submitting: false,
    success: false,
    error: ''
  });

  const [editGroupForm, setEditGroupForm] = useState({
    groupId: '',
    name: '',
    submitting: false,
    success: false,
    error: ''
  });

  const [memberManagement, setMemberManagement] = useState({
    selectedUserId: '',
    submitting: false,
    success: false,
    error: ''
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfile();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (profile?.orgId) {
      fetchUsers();
      fetchInvites();
      fetchGroups();
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const apiClient = new ApiClient(getToken);
      const profileData = await apiClient.getUserProfile();
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    }
  };

  const fetchUsers = async () => {
    if (!profile?.orgId) return;
    
    try {
      setLoading(true);
      const apiClient = new ApiClient(getToken);
      const data = await apiClient.getOrgUsers(profile.orgId);
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    if (!profile?.orgId) return;
    
    try {
      const apiClient = new ApiClient(getToken);
      const data = await apiClient.getInviteStatus(profile.orgId);
      setInvites(data.users);
    } catch (err) {
      console.error('Failed to fetch invites:', err);
    }
  };

  const fetchGroups = async () => {
    if (!profile?.orgId) return;
    
    try {
      setGroupsLoading(true);
      const apiClient = new ApiClient(getToken);
      const data = await apiClient.getGroups(profile.orgId);
      setGroups(data.groups);
      setGroupError(null);
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    if (!profile?.orgId) return;
    
    try {
      const apiClient = new ApiClient(getToken);
      const data = await apiClient.getGroupById(profile.orgId, groupId);
      setGroupMembers(data.members);
    } catch (err) {
      console.error('Failed to fetch group members:', err);
    }
  };

  const handleSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId) return;
    
    setInviteForm(prev => ({ ...prev, submitting: true, error: '', success: false }));
    
    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.inviteSingleUser(
        profile.orgId, 
        inviteForm.email, 
        undefined, // displayName will be set from Clerk data
        undefined  // group functionality will be added later
      );
      
      setInviteForm({
        email: '',
        submitting: false,
        success: true,
        error: ''
      });
      
      // Refresh data
      fetchUsers();
      fetchInvites();
    } catch (err) {
      setInviteForm(prev => ({ 
        ...prev, 
        submitting: false, 
        error: err instanceof Error ? err.message : 'Failed to send invitation'
      }));
    }
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId) return;
    
    setBulkInviteForm(prev => ({ ...prev, submitting: true, error: '', success: false, result: null }));
    
    try {
      // Parse email list (one per line)
      const lines = bulkInviteForm.users.trim().split('\n');
      const users = lines.map(line => {
        const email = line.trim();
        return { email }; // displayName will be set from Clerk, no groups for now
      }).filter(u => u.email);

      const apiClient = new ApiClient(getToken);
      const result = await apiClient.bulkInviteUsers(profile.orgId, users);
      
      setBulkInviteForm(prev => ({
        ...prev,
        submitting: false,
        success: true,
        result,
        users: ''
      }));
      
      // Refresh data
      fetchUsers();
      fetchInvites();
    } catch (err) {
      setBulkInviteForm(prev => ({ 
        ...prev, 
        submitting: false, 
        error: err instanceof Error ? err.message : 'Failed to send bulk invitations'
      }));
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId) return;
    
    setCreateGroupForm(prev => ({ ...prev, submitting: true, error: '', success: false }));
    
    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.createGroup(profile.orgId, createGroupForm.name);
      
      setCreateGroupForm({
        name: '',
        submitting: false,
        success: true,
        error: ''
      });
      
      // Refresh groups
      fetchGroups();
    } catch (err) {
      setCreateGroupForm(prev => ({ 
        ...prev, 
        submitting: false, 
        error: err instanceof Error ? err.message : 'Failed to create group'
      }));
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.orgId || !editGroupForm.groupId) return;
    
    setEditGroupForm(prev => ({ ...prev, submitting: true, error: '', success: false }));
    
    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.updateGroup(profile.orgId, editGroupForm.groupId, editGroupForm.name);
      
      setEditGroupForm({
        groupId: '',
        name: '',
        submitting: false,
        success: true,
        error: ''
      });
      
      // Refresh groups
      fetchGroups();
      setSelectedGroup(null);
    } catch (err) {
      setEditGroupForm(prev => ({ 
        ...prev, 
        submitting: false, 
        error: err instanceof Error ? err.message : 'Failed to update group'
      }));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!profile?.orgId || !confirm('Are you sure you want to delete this group? This will remove all members from the group.')) return;
    
    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.deleteGroup(profile.orgId, groupId);
      
      // Refresh groups and users
      fetchGroups();
      fetchUsers();
      setSelectedGroup(null);
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : 'Failed to delete group');
    }
  };

  const handleAddMemberToGroup = async (groupId: string, userId: string) => {
    if (!profile?.orgId) return;
    
    setMemberManagement(prev => ({ ...prev, submitting: true, error: '', success: false }));
    
    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.addMemberToGroup(profile.orgId, groupId, userId);
      
      setMemberManagement({
        selectedUserId: '',
        submitting: false,
        success: true,
        error: ''
      });
      
      // Refresh data
      fetchGroups();
      fetchUsers();
      if (selectedGroup) {
        fetchGroupMembers(groupId);
      }
    } catch (err) {
      setMemberManagement(prev => ({ 
        ...prev, 
        submitting: false, 
        error: err instanceof Error ? err.message : 'Failed to add member to group'
      }));
    }
  };

  const handleRemoveMemberFromGroup = async (groupId: string, userId: string) => {
    if (!profile?.orgId || !confirm('Are you sure you want to remove this member from the group?')) return;
    
    try {
      const apiClient = new ApiClient(getToken);
      await apiClient.removeMemberFromGroup(profile.orgId, groupId, userId);
      
      // Refresh data
      fetchGroups();
      fetchUsers();
      if (selectedGroup) {
        fetchGroupMembers(groupId);
      }
    } catch (err) {
      setGroupError(err instanceof Error ? err.message : 'Failed to remove member from group');
    }
  };

  const startEditGroup = (group: Group) => {
    setEditGroupForm({
      groupId: group._id,
      name: group.name,
      submitting: false,
      success: false,
      error: ''
    });
  };

  const selectGroup = (group: Group) => {
    setSelectedGroup(group);
    fetchGroupMembers(group._id);
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

  if (profile && profile.role !== 'client_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">This page is only accessible to Client Administrators.</p>
          <Link href="/test" className="text-blue-600 hover:underline">Back to Test Dashboard</Link>
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
          <h1 className="text-3xl font-bold text-gray-900">Client Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage users and send invitations for your organization</p>
        </div>

        {/* Single User Invite */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Invite Single User</h2>
          
          <form onSubmit={handleSingleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="student@university.edu"
              />
            </div>
            
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <strong>Note:</strong> The display name will be automatically set from the user's Clerk profile when they sign up.
            </div>
            
            <button
              type="submit"
              disabled={inviteForm.submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {inviteForm.submitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>

          {inviteForm.success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-green-800">✅ Invitation sent successfully!</div>
            </div>
          )}

          {inviteForm.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">❌ {inviteForm.error}</div>
            </div>
          )}
        </div>

        {/* Bulk Invite */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Invite Users</h2>
          <p className="text-gray-600 mb-4">
            Enter email addresses (one per line). Display names will be set automatically from Clerk profiles.
          </p>
          
          <form onSubmit={handleBulkInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Data
              </label>
              <textarea
                value={bulkInviteForm.users}
                onChange={(e) => setBulkInviteForm(prev => ({ ...prev, users: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder={`student1@university.edu
student2@university.edu
student3@university.edu
student4@university.edu
student5@university.edu`}
              />
            </div>
            
            <button
              type="submit"
              disabled={bulkInviteForm.submitting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {bulkInviteForm.submitting ? 'Sending Invitations...' : 'Send Bulk Invitations'}
            </button>
          </form>

          {bulkInviteForm.success && bulkInviteForm.result && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-green-800">
                ✅ Bulk invitation completed!
                <div className="mt-2 text-sm">
                  <div>Successful: {bulkInviteForm.result.successful}</div>
                  <div>Failed: {bulkInviteForm.result.failed}</div>
                </div>
              </div>
            </div>
          )}

          {bulkInviteForm.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">❌ {bulkInviteForm.error}</div>
            </div>
          )}
        </div>

        {/* Users and Invites Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'invites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Invites ({invites.filter(u => u.status === 'invited').length})
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`py-2 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'groups'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Groups ({groups.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading && (
              <div className="text-center py-8">Loading...</div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="text-red-800">Error: {error}</div>
              </div>
            )}

            {!loading && !error && activeTab !== 'groups' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Groups
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(activeTab === 'users' ? users : invites).map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.groups.join(', ') || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.points || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(activeTab === 'users' ? users : invites).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {activeTab === 'users' ? 'No users found.' : 'No pending invites.'}
                  </div>
                )}
              </div>
            )}

            {/* Groups Tab Content */}
            {activeTab === 'groups' && (
              <div className="space-y-6">
                {/* Create Group Form */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Create New Group</h3>
                  <form onSubmit={handleCreateGroup} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={createGroupForm.name}
                        onChange={(e) => setCreateGroupForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter group name"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={createGroupForm.submitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {createGroupForm.submitting ? 'Creating...' : 'Create Group'}
                    </button>
                  </form>

                  {createGroupForm.success && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="text-green-800">✅ Group created successfully!</div>
                    </div>
                  )}

                  {createGroupForm.error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="text-red-800">❌ {createGroupForm.error}</div>
                    </div>
                  )}
                </div>

                {/* Groups List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupsLoading && (
                    <div className="col-span-full text-center py-8">Loading groups...</div>
                  )}

                  {groupError && (
                    <div className="col-span-full bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="text-red-800">Error: {groupError}</div>
                    </div>
                  )}

                  {!groupsLoading && !groupError && groups.map((group) => (
                    <div key={group._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditGroup(group)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group._id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => selectGroup(group)}
                        className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200"
                      >
                        View Members
                      </button>
                    </div>
                  ))}

                  {!groupsLoading && !groupError && groups.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No groups found. Create your first group above.
                    </div>
                  )}
                </div>

                {/* Edit Group Form */}
                {editGroupForm.groupId && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Edit Group</h3>
                    <form onSubmit={handleEditGroup} className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Group Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editGroupForm.name}
                          onChange={(e) => setEditGroupForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter group name"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={editGroupForm.submitting}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {editGroupForm.submitting ? 'Updating...' : 'Update Group'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditGroupForm({ groupId: '', name: '', submitting: false, success: false, error: '' })}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </form>

                    {editGroupForm.success && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="text-green-800">✅ Group updated successfully!</div>
                      </div>
                    )}

                    {editGroupForm.error && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="text-red-800">❌ {editGroupForm.error}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Group Members */}
                {selectedGroup && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Members of "{selectedGroup.name}"</h3>
                      <button
                        onClick={() => setSelectedGroup(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕ Close
                      </button>
                    </div>

                    {/* Add Member Form */}
                    <div className="mb-4 p-3 bg-white rounded border">
                      <h4 className="font-medium mb-2">Add Member to Group</h4>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select User
                          </label>
                          <select
                            value={memberManagement.selectedUserId}
                            onChange={(e) => setMemberManagement(prev => ({ ...prev, selectedUserId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select a user...</option>
                            {users
                              .filter(user => !user.groups.includes(selectedGroup.name))
                              .map(user => (
                                <option key={user._id} value={user._id}>
                                  {user.displayName} ({user.email})
                                </option>
                              ))
                            }
                          </select>
                        </div>
                        <button
                          onClick={() => handleAddMemberToGroup(selectedGroup._id, memberManagement.selectedUserId)}
                          disabled={!memberManagement.selectedUserId || memberManagement.submitting}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {memberManagement.submitting ? 'Adding...' : 'Add Member'}
                        </button>
                      </div>

                      {memberManagement.success && (
                        <div className="mt-2 text-green-600 text-sm">✅ Member added successfully!</div>
                      )}

                      {memberManagement.error && (
                        <div className="mt-2 text-red-600 text-sm">❌ {memberManagement.error}</div>
                      )}
                    </div>

                    {/* Members List */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Member
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Joined
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {groupMembers.map((member) => (
                            <tr key={member._id}>
                              <td className="px-4 py-2">
                                <div className="text-sm font-medium text-gray-900">{member.displayName}</div>
                                <div className="text-sm text-gray-500">{member.email}</div>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  member.status === 'active' ? 'bg-green-100 text-green-800' :
                                  member.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {member.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {new Date(member.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => handleRemoveMemberFromGroup(selectedGroup._id, member._id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {groupMembers.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No members in this group yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
