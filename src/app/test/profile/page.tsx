'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import Link from 'next/link';

interface UserProfile {
  _id: string;
  clerkId: string;
  email: string;
  displayName: string;
  role: 'system_admin' | 'client_admin' | 'affiliated' | 'non_affiliated';
  orgId?: string;
  orgName?: string;
  groupIds: string[];
  status: 'invited' | 'active' | 'suspended';
  points: number;
  riskScore: number;
  createdAt: string;
  updatedAt: string;
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
  lastSignInAt?: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserProfile();
    }
  }, [isLoaded, user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const apiClient = new ApiClient(getToken);
      const profileData = await apiClient.getUserProfile();
      setProfile(profileData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Link href="/sign-in" className="text-blue-600 hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/test" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Test Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600 mt-2">Complete profile information from both Clerk and backend</p>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-gray-600">Loading profile...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
              <button 
                onClick={fetchUserProfile}
                className="mt-2 text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {profile && (
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                {profile.profileImageUrl && (
                  <img 
                    src={profile.profileImageUrl} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full mr-4"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{profile.displayName}</h2>
                  <p className="text-gray-600">{profile.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Role</dt>
                      <dd className="mt-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          profile.role === 'system_admin' ? 'bg-red-100 text-red-800' :
                          profile.role === 'client_admin' ? 'bg-blue-100 text-blue-800' :
                          profile.role === 'affiliated' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {profile.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          profile.status === 'active' ? 'bg-green-100 text-green-800' :
                          profile.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {profile.status.toUpperCase()}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Organization</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile.orgName || 'No organization'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Points</dt>
                      <dd className="mt-1 text-2xl font-semibold text-green-600">
                        {profile.points}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Risk Score</dt>
                      <dd className="mt-1 text-2xl font-semibold text-red-600">
                        {profile.riskScore}
                      </dd>
                    </div>

                    {profile.lastSignInAt && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(profile.lastSignInAt).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Details</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Database ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{profile._id}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Clerk ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{profile.clerkId}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {profile.orgId || 'None'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Group IDs</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {profile.groupIds.length > 0 ? profile.groupIds.join(', ') : 'None'}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profile.createdAt).toLocaleString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Updated At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profile.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={fetchUserProfile}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Refresh Profile
                </button>
                
                {profile.role === 'system_admin' && (
                  <Link
                    href="/test/system-admin"
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    System Admin Panel
                  </Link>
                )}
                
                {profile.role === 'client_admin' && (
                  <Link
                    href="/test/client-admin"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Client Admin Panel
                  </Link>
                )}
                
                <Link
                  href="/dashboard"
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Original Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
