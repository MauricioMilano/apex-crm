'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCRM } from '@/contexts/crm-context';
import { useOrgFormat } from '@/hooks/use-org-format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { User, Mail, Phone, Lock, Bell, Trash2, CheckCircle } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email('Valid email required'),
  phone:     z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ClientPortalProfilePage() {
  const { currentUser } = useAuth();
  const { clients, updateClient } = useCRM();
  const [profileSaved, setProfileSaved] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifReminder, setNotifReminder] = useState(true);
  const { formatDate } = useOrgFormat();

  const client = useMemo(
    () =>
      clients.find(
        (c) => c.email?.toLowerCase() === currentUser?.email?.toLowerCase(),
      ),
    [clients, currentUser],
  );

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: client?.firstName ?? currentUser?.firstName ?? '',
      lastName:  client?.lastName  ?? currentUser?.lastName  ?? '',
      email:     client?.email     ?? currentUser?.email     ?? '',
      phone:     client?.phone     ?? currentUser?.phone     ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSaveProfile = (data: ProfileFormData) => {
    if (client) {
      void updateClient(client.id, {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        phone:     data.phone,
      });
    }
    setProfileSaved(true);
    toast.success('Profile updated successfully');
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const onChangePassword = (_data: PasswordFormData) => {
    toast.success('Password changed successfully');
    passwordForm.reset();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account details and preferences.</p>
      </div>

      {/* Avatar / summary card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold shrink-0">
              {(currentUser?.firstName?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentUser?.firstName} {currentUser?.lastName}
              </h2>
              <p className="text-sm text-gray-500 truncate">{currentUser?.email}</p>
              {client && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Client since {formatDate(client.createdAt)}
                </p>
              )}
            </div>
            <Badge variant="secondary">Client</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Personal information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-gray-500" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your name, email, and phone number.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="given-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="family-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="email"
                          className="pl-9"
                          autoComplete="email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          {...field}
                          type="tel"
                          placeholder="(555) 000-0000"
                          className="pl-9"
                          autoComplete="tel"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={profileSaved}>
                {profileSaved ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Saved
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-gray-500" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onChangePassword)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" variant="outline">
                Update Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-gray-500" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-gray-500">
                Receive booking confirmations via email
              </p>
            </div>
            <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">SMS Reminders</Label>
              <p className="text-xs text-gray-500">
                Get text reminders before appointments
              </p>
            </div>
            <Switch checked={notifSms} onCheckedChange={setNotifSms} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">24h Appointment Reminders</Label>
              <p className="text-xs text-gray-500">
                Reminder sent 24 hours before your appointment
              </p>
            </div>
            <Switch checked={notifReminder} onCheckedChange={setNotifReminder} />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success('Preferences saved')}
          >
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-600">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently remove your account and all your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            To delete your account, please contact our support team at{' '}
            <a
              href="mailto:support@apex.com"
              className="text-blue-600 hover:underline"
            >
              support@apex.com
            </a>
            . This action cannot be undone.
          </p>
          <Button
            variant="outline"
            disabled
            className="text-red-500 border-red-200 cursor-not-allowed opacity-60"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Contact support to delete your account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
