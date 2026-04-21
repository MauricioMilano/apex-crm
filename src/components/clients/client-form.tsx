'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Client } from '@/types';
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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, X } from 'lucide-react';

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
  tags: z.string().optional(),
  notes: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  customFields: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .optional(),
});

type FormValues = z.infer<typeof schema>;

interface ClientFormProps {
  client?: Client;
  organizationId?: string;
  onSubmit: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function ClientForm({
  client,
  organizationId = 'org_1',
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: client?.firstName ?? '',
      lastName: client?.lastName ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      company: client?.company ?? '',
      tags: client?.tags?.join(', ') ?? '',
      notes: client?.notes ?? '',
      address: client?.address ?? '',
      city: client?.city ?? '',
      state: client?.state ?? '',
      zip: client?.zip ?? '',
      customFields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  function handleSubmit(values: FormValues) {
    const tags = values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    onSubmit({
      organizationId: client?.organizationId ?? organizationId,
      locationId: client?.locationId,
      assignedTo: client?.assignedTo,
      leadId: client?.leadId,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || undefined,
      phone: values.phone || undefined,
      company: values.company || undefined,
      address: values.address || undefined,
      city: values.city || undefined,
      state: values.state || undefined,
      zip: values.zip || undefined,
      notes: values.notes || undefined,
      tags,
      isActive: client?.isActive ?? true,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
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
                <FormLabel>Last Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@example.com" {...field} />
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input placeholder="Company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. vip, consulting, recurring" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Internal notes..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />
        <p className="text-sm font-semibold">Billing Info</p>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Street address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="IL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP</FormLabel>
                <FormControl>
                  <Input placeholder="60601" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Custom Fields</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ key: '', value: '' })}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>

        {fields.map((f, index) => (
          <div key={f.id} className="flex gap-2 items-start">
            <FormField
              control={form.control}
              name={`customFields.${index}.key`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Field name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`customFields.${index}.value`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Value" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {client ? 'Save Changes' : 'Create Client'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
