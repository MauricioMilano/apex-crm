'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/contexts/crm-context';
import { Form } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus,
  FileText,
  MoreVertical,
  Edit,
  Eye,
  Code,
  Trash2,
  Copy,
} from 'lucide-react';

export default function FormsPage() {
  const router = useRouter();
  const { forms, addForm, deleteForm } = useCRM();
  const [embedForm, setEmbedForm] = useState<Form | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Form | null>(null);

  const handleNewForm = () => {
    const created = addForm({
      organizationId: 'org_1',
      name: 'Untitled Form',
      fields: [],
      isActive: false,
      submissionsCount: 0,
    });
    router.push(`/dashboard/forms/builder/${created.id}`);
  };

  const handleCopyEmbed = (form: Form) => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com';
    const code = `<iframe src="${origin}/f/${form.id}" width="100%" height="600" frameborder="0" allow="clipboard-write"></iframe>`;
    navigator.clipboard.writeText(code).then(() => {
      toast.success('Embed code copied to clipboard');
    });
  };

  const sortedForms = [...forms].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Forms</h1>
          <p className="text-sm text-gray-400 mt-1">
            Build and manage lead capture forms.
          </p>
        </div>
        <Button
          onClick={handleNewForm}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      {/* Forms grid */}
      {sortedForms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <FileText className="h-12 w-12 opacity-30" />
          <p className="text-sm">No forms yet. Create one to get started.</p>
          <Button
            onClick={handleNewForm}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedForms.map((form) => (
            <Card
              key={form.id}
              className="bg-gray-900 border-gray-800 flex flex-col"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-white text-base font-semibold leading-snug line-clamp-2">
                    {form.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-gray-500 hover:text-white hover:bg-gray-800"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-gray-900 border-gray-800"
                    >
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/dashboard/forms/builder/${form.id}`)
                        }
                        className="text-gray-200 hover:bg-gray-800 cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(`/f/${form.id}`, '_blank')
                        }
                        className="text-gray-200 hover:bg-gray-800 cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEmbedForm(form)}
                        className="text-gray-200 hover:bg-gray-800 cursor-pointer"
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Embed Code
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-800" />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(form)}
                        className="text-red-400 hover:bg-gray-800 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pb-3">
                {form.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {form.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}</span>
                  <span className="text-gray-700">·</span>
                  <span>{form.submissionsCount} submission{form.submissionsCount !== 1 ? 's' : ''}</span>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {format(new Date(form.createdAt), 'MMM d, yyyy')}
                </span>
                <Badge
                  className={
                    form.isActive
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-gray-700/50 text-gray-500 border-gray-700'
                  }
                >
                  {form.isActive ? 'Published' : 'Draft'}
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Embed code dialog */}
      <Dialog open={!!embedForm} onOpenChange={() => setEmbedForm(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Embed Form</DialogTitle>
          </DialogHeader>
          {embedForm && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Copy the code below and paste it into your website.
              </p>
              <div className="relative">
                <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {`<iframe\n  src="${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/f/${embedForm.id}"\n  width="100%"\n  height="600"\n  frameborder="0"\n></iframe>`}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 border-gray-700 text-gray-300 hover:bg-gray-800 h-7"
                  onClick={() => handleCopyEmbed(embedForm)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Public URL:{' '}
                <span className="text-gray-400">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/f/{embedForm.id}
                </span>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Form</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteForm(deleteTarget.id);
                  toast.success('Form deleted');
                  setDeleteTarget(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
