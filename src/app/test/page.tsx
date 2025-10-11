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
  status: 'invited' | 'active' | 'suspended';
  points: number;
  riskScore: number;
}

export default function TestDashboard() {
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
          <p className="text-gray-600 mb-4">You need to be signed in to access the test dashboard.</p>
          <Link 
            href="/sign-in"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CyberShield Test Dashboard</h1>
          <p className="text-gray-600 mt-2">Test the backend integration and user flows</p>
        </div>

        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Current User Profile</h2>
          
          {loading && (
            <div className="text-center py-4">
              <div className="text-gray-600">Loading profile...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
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
          )}

          {profile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Email:</strong> {profile.email}
              </div>
              <div>
                <strong>Display Name:</strong> {profile.displayName}
              </div>
              <div>
                <strong>Role:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  profile.role === 'system_admin' ? 'bg-red-100 text-red-800' :
                  profile.role === 'client_admin' ? 'bg-blue-100 text-blue-800' :
                  profile.role === 'affiliated' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.role}
                </span>
              </div>
              <div>
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  profile.status === 'active' ? 'bg-green-100 text-green-800' :
                  profile.status === 'invited' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {profile.status}
                </span>
              </div>
              <div>
                <strong>Organization:</strong> {profile.orgName || 'None'}
              </div>
              <div>
                <strong>Points:</strong> {profile.points}
              </div>
              <div>
                <strong>Risk Score:</strong> {profile.riskScore}
              </div>
              <div>
                <strong>Clerk ID:</strong> {profile.clerkId}
              </div>
            </div>
          )}
        </div>

        {/* Role-based Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* System Admin Panel */}
          {profile?.role === 'system_admin' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-700">System Admin Panel</h3>
              <div className="space-y-3">
                <Link 
                  href="/test/system-admin"
                  className="block w-full bg-red-600 text-white text-center py-2 px-4 rounded hover:bg-red-700 transition-colors"
                >
                  Manage Organizations
                </Link>
                <Link 
                  href="/test/system-admin/invite-client"
                  className="block w-full bg-red-500 text-white text-center py-2 px-4 rounded hover:bg-red-600 transition-colors"
                >
                  Invite Client Admin
                </Link>
              </div>
            </div>
          )}

          {/* Client Admin Panel */}
          {profile?.role === 'client_admin' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-700">Client Admin Panel</h3>
              <div className="space-y-3">
                <Link 
                  href="/test/client-admin"
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  Manage Users
                </Link>
                <Link 
                  href="/test/client-admin/bulk-invite"
                  className="block w-full bg-blue-500 text-white text-center py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                >
                  Bulk Invite Users
                </Link>
              </div>
            </div>
          )}

          {/* User Profile Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-green-700">User Profile</h3>
            <div className="space-y-3">
              <Link 
                href="/test/profile"
                className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded hover:bg-green-700 transition-colors"
              >
                View Full Profile
              </Link>
              <button 
                onClick={fetchUserProfile}
                className="block w-full bg-green-500 text-white text-center py-2 px-4 rounded hover:bg-green-600 transition-colors"
              >
                Refresh Profile
              </button>
            </div>
          </div>

          {/* General Testing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-purple-700">General Testing</h3>
            <div className="space-y-3">
              <Link 
                href="/test/api-test"
                className="block w-full bg-purple-600 text-white text-center py-2 px-4 rounded hover:bg-purple-700 transition-colors"
              >
                API Test Suite
              </Link>
              <Link 
                href="/dashboard"
                className="block w-full bg-gray-600 text-white text-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Original Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Testing Instructions</h3>
          <div className="text-blue-700 space-y-2">
            <p><strong>1. System Admin:</strong> Use the system admin panel to invite client admins and manage organizations.</p>
            <p><strong>2. Client Admin:</strong> Use the client admin panel to bulk invite users and manage your organization.</p>
            <p><strong>3. Users:</strong> View your profile and test user-specific functionality.</p>
            <p><strong>4. API Testing:</strong> Use the API test suite to manually test backend endpoints.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
