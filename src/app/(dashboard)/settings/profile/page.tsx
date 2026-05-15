'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useOrgFormat } from '@/hooks/use-org-format';
import { updateUserProfile } from '@/actions/auth';
import { changePassword } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Lock, Trash2, Camera, CheckCircle, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function InternalProfilePage() {
  const { currentUser } = useAuth();
  const { formatDate } = useOrgFormat();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: currentUser?.firstName ?? '',
      lastName: currentUser?.lastName ?? '',
      email: currentUser?.email ?? '',
      phone: currentUser?.phone ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ''}${currentUser.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?';

  const roleBadgeColor =
    currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
      ? 'border-purple-500/50 text-purple-400'
      : 'border-primary/50 text-primary';

  const onSaveProfile = async (data: ProfileFormData) => {
    if (!currentUser) return;
    const result = await updateUserProfile(currentUser.id, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setProfileSaved(true);
    toast.success('Profile updated successfully');
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const onChangePassword = async (data: PasswordFormData) => {
    if (!currentUser) return;
    const result = await changePassword(currentUser.id, {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Password changed successfully');
    passwordForm.reset();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Preview locally
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Upload failed');
        setAvatarPreview(null);
        return;
      }
      const _result = await res.json();
      toast.success('Avatar updated');
      // Force re-render by reloading the page
      window.location.reload();
    } catch {
      toast.error('Upload failed');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Avatar / Summary Card */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20">
                {avatarPreview || currentUser?.avatar ? (
                  <AvatarImage src={avatarPreview ?? currentUser?.avatar ?? ''} />
                ) : null}
                <AvatarFallback className="bg-primary text-foreground text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 bg-muted border border-border rounded-full p-1.5 hover:bg-accent transition-colors disabled:opacity-50"
                aria-label="Upload avatar"
              >
                {avatarUploading ? (
                  <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {currentUser?.firstName} {currentUser?.lastName}
                </h2>
                <Badge variant="outline" className={roleBadgeColor}>
                  {currentUser?.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{currentUser?.email}</p>
              {currentUser?.createdAt && (
                <p className="text-xs text-muted-foreground/80 mt-0.5">
                  Member since {formatDate(currentUser.createdAt)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <User className="h-4 w-4 text-muted-foreground/80" />
            Personal Information
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Update your name, email, and phone number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">First Name</Label>
                <Input
                  {...profileForm.register('firstName')}
                  className="bg-muted border-border text-foreground focus:border-primary"
                />
                {profileForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive/80">{profileForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Last Name</Label>
                <Input
                  {...profileForm.register('lastName')}
                  className="bg-muted border-border text-foreground focus:border-primary"
                />
                {profileForm.formState.errors.lastName && (
                  <p className="text-sm text-destructive/80">{profileForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/80" />
                <Input
                  {...profileForm.register('email')}
                  type="email"
                  className="pl-9 bg-muted border-border text-foreground focus:border-primary"
                />
              </div>
              {profileForm.formState.errors.email && (
                <p className="text-sm text-destructive/80">{profileForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/80" />
                <Input
                  {...profileForm.register('phone')}
                  type="tel"
                  placeholder="(555) 000-0000"
                  className="pl-9 bg-muted border-border text-foreground focus:border-primary"
                />
              </div>
              {profileForm.formState.errors.phone && (
                <p className="text-sm text-destructive/80">{profileForm.formState.errors.phone.message}</p>
              )}
            </div>

            <Button type="submit" disabled={profileSaved} className="bg-primary hover:bg-primary/90">
              {profileSaved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  Saved
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Lock className="h-4 w-4 text-muted-foreground/80" />
            Change Password
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Update your account password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current Password</Label>
              <Input
                {...passwordForm.register('currentPassword')}
                type="password"
                placeholder="••••••••"
                className="bg-muted border-border text-foreground focus:border-primary"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive/80">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">New Password</Label>
                <Input
                  {...passwordForm.register('newPassword')}
                  type="password"
                  placeholder="••••••••"
                  className="bg-muted border-border text-foreground focus:border-primary"
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive/80">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Confirm New Password</Label>
                <Input
                  {...passwordForm.register('confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  className="bg-muted border-border text-foreground focus:border-primary"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive/80">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" variant="outline" className="border-border text-muted-foreground">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive/80">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Permanently remove your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            To delete your account, please contact your organization administrator or our support team at{' '}
            <a href="mailto:support@apex.com" className="text-primary hover:underline">
              support@apex.com
            </a>
            . This action cannot be undone.
          </p>
          <Button
            variant="outline"
            disabled
            className="text-destructive/80 border-destructive/50 cursor-not-allowed opacity-60"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Contact support to delete your account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
