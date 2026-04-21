import { Building2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-3xl font-bold tracking-tight">ApexCRM</span>
        </div>
        <p className="text-sm text-muted-foreground">Professional CRM System</p>
      </div>
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}
