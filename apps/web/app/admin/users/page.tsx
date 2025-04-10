'use client';

import React, { useState } from 'react'; // Import useState
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Import Button
import { useGetAdminUsersQuery } from '@/graphql/generated/graphql';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

function AdminUsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20); // Default items per page

  const offset = (currentPage - 1) * limit;

  const { data, loading, error, refetch } = useGetAdminUsersQuery({ // Added refetch
    variables: { offset, limit },
    fetchPolicy: 'cache-and-network',
  });

  const totalCount = data?.getAdminUsers?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Refetch is handled automatically by Apollo when variables change,
      // but explicit refetch can be used if needed for specific scenarios.
      // refetch({ offset: (currentPage - 2) * limit, limit });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // refetch({ offset: currentPage * limit, limit });
    }
  };


  const formatDate = (dateString: string | number | Date) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <AdminRouteGuard>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Users ({loading ? '...' : totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading and Error States remain the same */}
            {loading && (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2">Loading users...</span>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error Loading Users</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            {!loading && !error && data?.getAdminUsers?.users && (
              <> {/* Wrap Table and Pagination in Fragment */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Profile Complete</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.getAdminUsers.users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No users found for this page.
                        </TableCell>
                      </TableRow>
                    )}
                    {data.getAdminUsers.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.firstName ?? '-'}</TableCell>
                        <TableCell>{user.lastName ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.profileComplete ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                     <span className="text-sm text-muted-foreground">
                       Page {currentPage} of {totalPages} ({totalCount} users)
                     </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRouteGuard>
  );
}

export default AdminUsersPage;