'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lead, LeadStatus, User } from '@/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: 'Invalid email address',
    }),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  statusId: z.string().min(1, 'Status is required'),
  assignedTo: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  value: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LeadFormProps {
  lead?: Lead;
  leadStatuses: LeadStatus[];
  users: User[];
  defaultStatusId?: string;
  organizationId?: string;
  onSubmit: (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function LeadForm({
  lead,
  leadStatuses,
  users,
  defaultStatusId,
  organizationId = '',
  onSubmit,
  onCancel,
}: LeadFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: lead?.firstName ?? '',
      lastName: lead?.lastName ?? '',
      email: lead?.email ?? '',
      phone: lead?.phone ?? '',
      company: lead?.company ?? '',
      source: lead?.source ?? '',
      statusId:
        lead?.statusId ?? defaultStatusId ?? leadStatuses[0]?.id ?? '',
      assignedTo: lead?.assignedTo ?? '',
      tags: lead?.tags?.join(', ') ?? '',
      notes: lead?.notes ?? '',
      value: lead?.value != null ? String(lead.value) : '',
    },
  });

  function handleSubmit(values: FormValues) {
    const tags = values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const parsedValue = values.value ? parseFloat(values.value) : undefined;
    const value =
      parsedValue !== undefined && !isNaN(parsedValue)
        ? parsedValue
        : undefined;

    onSubmit({
      organizationId: lead?.organizationId ?? organizationId,
      locationId: lead?.locationId,
      statusId: values.statusId,
      assignedTo: values.assignedTo || undefined,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || undefined,
      phone: values.phone || undefined,
      company: values.company || undefined,
      source: values.source || undefined,
      notes: values.notes || undefined,
      value,
      tags,
      convertedToClientId: lead?.convertedToClientId,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
                    {...field}
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Doe"
                    {...field}
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    {...field}
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1 (555) 000-0000"
                    {...field}
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Company + Value row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Company</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Acme Inc."
                    {...field}
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Deal Value ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Source + Status row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Source</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="import">Import</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="statusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {leadStatuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Assigned to */}
        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Assigned To</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === 'unassigned' ? undefined : v)}
                value={field.value ?? 'unassigned'}
              >
                <FormControl>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users
                    .filter((u) => u.isActive)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName} {u.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">
                Tags (comma-separated)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="hot lead, enterprise, Q2"
                  {...field}
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add notes about this lead..."
                  {...field}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {lead ? 'Save Changes' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
