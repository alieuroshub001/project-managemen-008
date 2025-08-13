// components/Employee/Profile/EmployeeProfile.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Camera, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { IEmployeeProfile } from '@/types';

export default function EmployeeProfile() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<IEmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    hireDate: '',
    employmentType: '',
  });
  const [profilePicture, setProfilePicture] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/employee/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setFormData({
            name: data.user?.name || '',
            email: data.user?.email || '',
            department: data.department || '',
            position: data.position || '',
            hireDate: data.hireDate ? new Date(data.hireDate).toISOString().split('T')[0] : '',
            employmentType: data.employmentType || '',
          });
          setProfilePicture(data.user?.image || '');
        } else {
          throw new Error('Failed to fetch profile');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          hireDate: new Date(formData.hireDate).toISOString(),
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        await update({
          ...session?.user,
          name: formData.name,
          image: profilePicture,
        });
        toast.success('Profile updated successfully');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok && result.data?.[0]?.secure_url) {
        setProfilePicture(result.data[0].secure_url);
        
        // Update the profile picture in the database
        await fetch('/api/employee/profile/picture', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: result.data[0].secure_url }),
        });

        // Update the session
        await update({
          ...session?.user,
          image: result.data[0].secure_url,
        });

        toast.success('Profile picture updated successfully');
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Employee Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profilePicture} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-picture"
                  className="absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Camera className="h-4 w-4 text-white" />
                  )}
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">{profile?.user?.name}</h3>
                <p className="text-sm text-muted-foreground">{profile?.position}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{profile?.user?.name}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="p-2 border rounded-md">{profile?.user?.email}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                {isEditing ? (
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{profile?.department}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                {isEditing ? (
                  <Input
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">{profile?.position}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                {isEditing ? (
                  <Input
                    id="hireDate"
                    name="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="p-2 border rounded-md">
                    {profile?.hireDate ? new Date(profile.hireDate).toLocaleDateString() : ''}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                {isEditing ? (
                  <select
                    id="employmentType"
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                ) : (
                  <div className="p-2 border rounded-md capitalize">
                    {profile?.employmentType?.replace('-', ' ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}