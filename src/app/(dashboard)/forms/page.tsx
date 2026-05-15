'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/contexts/crm-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Form } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Switch,
} from '@/components/ui/switch';
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
import { useOrgFormat } from '@/hooks/use-org-format';
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
  const { formatDate } = useOrgFormat();
  const currentUser = useCurrentUser();
  const [embedForm, setEmbedForm] = useState<Form | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Form | null>(null);

  // Toggle form publish status
  const handleTogglePublish = async (formId: string, currentPublished: boolean) => {
    const newPublished = !currentPublished;
    
    try {
      await fetch('/api/v1/forms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formId, isPublished: newPublished }),
      });
      toast.success(`Form ${newPublished ? 'published' : 'unpublished'}`);
    } catch {
      toast.error('Failed to update form status');
    }
  };

  const handleNewForm = async () => {
    const created = await addForm({
      organizationId: currentUser?.organizationId ?? '',
      name: 'Untitled Form',
      fields: [],
      isPublished: false,
      submissionsCount: 0,
    });
    router.push(`/forms/builder/${created.id}`);
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
          <h1 className="text-2xl font-bold text-foreground">Forms</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build and manage lead capture forms.
          </p>
        </div>
        <Button
          onClick={handleNewForm}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      {/* Forms grid */}
      {sortedForms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <FileText className="h-12 w-12 opacity-30" />
          <p className="text-sm">No forms yet. Create one to get started.</p>
          <Button
            onClick={handleNewForm}
            variant="outline"
            className="border-border text-foreground/90 hover:bg-accent mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Form
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {sortedForms.map((form) => (
            <Card
              key={form.id}
              className="bg-card border-border flex flex-col"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-foreground text-base font-semibold leading-snug line-clamp-2">
                    {form.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-card border-border"
                    >
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/forms/builder/${form.id}`)
                        }
                        className="text-foreground/90 hover:bg-accent cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(`/f/${form.id}`, '_blank')
                        }
                        className="text-foreground/90 hover:bg-accent cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEmbedForm(form)}
                        className="text-foreground/90 hover:bg-accent cursor-pointer"
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Embed Code
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-muted" />
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(form)}
                        className="text-destructive/80 hover:bg-accent cursor-pointer"
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
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {form.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}</span>
                  <span className="text-foreground/80">·</span>
                  <span>{form.submissionsCount} submission{form.submissionsCount !== 1 ? 's' : ''}</span>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(form.createdAt)}
                  </span>
                  <Badge
                    variant={form.isPublished ? "default" : "secondary"}
                    className={
                      form.isPublished
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-muted/50 text-muted-foreground border-border'
                    }
                  >
                    {form.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={() => handleTogglePublish(form.id, form.isPublished)}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-muted"
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Embed code dialog */}
      <Dialog open={!!embedForm} onOpenChange={() => setEmbedForm(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Embed Form</DialogTitle>
          </DialogHeader>
          {embedForm && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy the code below and paste it into your website.
              </p>
              <div className="relative">
                <pre className="bg-background border border-border rounded-lg p-4 text-xs text-foreground/90 overflow-x-auto whitespace-pre-wrap break-all">
                  {`<iframe\n  src="${typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/f/${embedForm.id}"\n  width="100%"\n  height="600"\n  frameborder="0"\n></iframe>`}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 border-border text-foreground/90 hover:bg-accent h-7"
                  onClick={() => handleCopyEmbed(embedForm)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Public URL:{' '}
                <span className="text-muted-foreground">
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
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Form</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground/90 hover:bg-accent">
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
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
