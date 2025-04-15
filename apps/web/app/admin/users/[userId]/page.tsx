// apps/web/app/admin/users/[userId]/page.tsx
'use client'; // This component needs client-side interactivity (hooks)

import { useParams } from 'next/navigation';
import { useGetAdminUserQuery } from '@/graphql/generated/graphql'; // Import the generated hook
import AdminRouteGuard from '@/components/auth/AdminRouteGuard'; // Protect the route (Default import)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { format } from 'date-fns'; // For date formatting

function AdminUserDetailPageContent() {
  const params = useParams();
  const userId = params.userId as string; // Get userId from route params

  const { data, loading, error } = useGetAdminUserQuery({
    variables: { userId },
    skip: !userId, // Don't run query if userId is not available yet
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load user details: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  const user = data?.getAdminUser;

  if (!user) {
    return (
      <Alert>
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>User with ID {userId} not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Details: {user.firstName} {user.lastName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>First Name:</strong> {user.firstName ?? 'N/A'}</p>
        <p><strong>Last Name:</strong> {user.lastName ?? 'N/A'}</p>
        {/* TODO: Add Email/Phone here if added to schema/resolver */}
        <p>
          <strong>Role:</strong> <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>{user.role}</Badge>
        </p>
        <p>
          <strong>Profile Complete:</strong>{' '}
          <Badge variant={user.profileComplete ? 'default' : 'outline'}>
            {user.profileComplete ? 'Yes' : 'No'}
          </Badge>
        </p>
        <p><strong>Created At:</strong> {format(new Date(user.createdAt), 'PPP p')}</p>
        <p><strong>Last Updated:</strong> {format(new Date(user.updatedAt), 'PPP p')}</p>
        {/* Add links/buttons for Edit/Disable actions later */}
      </CardContent>
    </Card>
  );
}


// Wrap the content component with the AdminRouteGuard
export default function AdminUserDetailPage() {
    return (
        <AdminRouteGuard>
            <AdminUserDetailPageContent />
        </AdminRouteGuard>
    );
}