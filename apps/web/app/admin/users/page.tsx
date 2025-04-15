'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import Link from 'next/link'; // Import Link
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
import { Button } from "@/components/ui/button";
import {
 useGetAdminUsersQuery,
 useSetAdminUserStatusMutation,
 useUpdateAdminUserMutation, // Import the update mutation hook
 UserRole, // Import UserRole enum if needed
 AdminUser, // Import AdminUser type
} from '@/graphql/generated/graphql';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog"; // Import Dialog components
import { Input } from "@/components/ui/input"; // Import Input
import { Label } from "@/components/ui/label"; // Import Label
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"; // Import Select components
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
function AdminUsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for edit dialog
  const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null); // State for user being edited

  const offset = (currentPage - 1) * limit;

  const { data, loading, error, refetch } = useGetAdminUsersQuery({ // Added refetch
    variables: { offset, limit },
    fetchPolicy: 'cache-and-network', // Use cache-and-network to ensure UI updates after refetch
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
  // Mutation hook for setting user status
  const [setUserStatus, { loading: setUserStatusLoading }] = useSetAdminUserStatusMutation();
  const [updateUser, { loading: updateUserLoading }] = useUpdateAdminUserMutation(); // Init update mutation hook


  const formatDate = (dateString: string | number | Date) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const result = await setUserStatus({
        variables: {
          input: {
            userId: userId,
            isActive: !currentStatus, // Toggle the status
          },
        },
      });
      if (result.data?.setAdminUserStatus) {
        toast.success('Status Updated', { // Use sonner's toast.success
          description: `User ${userId} has been ${!currentStatus ? 'enabled' : 'disabled'}.`,
        });
        refetch(); // Refetch the user list to update the UI
      } else {
        throw new Error('Failed to update user status.');
      }
    } catch (err: any) {
      console.error('Error updating user status:', err);
      toast.error('Error', { // Use sonner's toast.error
        description: err.message || 'Could not update user status.',
      });
    }
  };

 // Handler to open the edit dialog
 const handleEditClick = (user: AdminUser) => {
   setEditingUser({ // Set only the fields we intend to edit
     id: user.id,
     firstName: user.firstName,
     lastName: user.lastName,
     email: user.email, // Assuming email is fetched
     role: user.role,
     profileComplete: user.profileComplete,
   });
   setIsEditDialogOpen(true);
 };

 // Handler for input changes in the edit form
 const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const { name, value } = e.target;
   setEditingUser(prev => prev ? { ...prev, [name]: value } : null);
 };

 // Handler for select change (role)
 const handleRoleChange = (value: UserRole) => {
   setEditingUser(prev => prev ? { ...prev, role: value } : null);
 };

 // Handler for checkbox change (profileComplete)
 const handleProfileCompleteChange = (checked: boolean) => {
   setEditingUser(prev => prev ? { ...prev, profileComplete: checked } : null);
 };

 // Handler to submit the edit form
 const handleEditSubmit = async () => {
   if (!editingUser || !editingUser.id) return;

   try {
     const result = await updateUser({
       variables: {
         input: {
           userId: editingUser.id,
           firstName: editingUser.firstName,
           lastName: editingUser.lastName,
           // email: editingUser.email, // Add email if editable
           role: editingUser.role,
           profileComplete: editingUser.profileComplete,
         },
       },
     });

     if (result.data?.updateAdminUser) {
       toast.success('User Updated', {
         description: `User ${editingUser.id} details have been updated.`,
       });
       setIsEditDialogOpen(false);
       setEditingUser(null);
       refetch(); // Refetch user list
     } else {
       throw new Error('Failed to update user.');
     }
   } catch (err: any) {
     console.error('Error updating user:', err);
     toast.error('Error', {
       description: err.message || 'Could not update user.',
     });
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
                     <TableHead className="text-right">Actions</TableHead> {/* Added Actions column */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.getAdminUsers.users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground"> {/* Updated colSpan */}
                          No users found for this page.
                        </TableCell>
                      </TableRow>
                    )}
                    {data.getAdminUsers.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:underline">
                            {user.id}
                          </Link>
                        </TableCell>
                        <TableCell>{user.firstName ?? '-'}</TableCell>
                        <TableCell>{user.lastName ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.profileComplete ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                       <TableCell className="text-right"> {/* Added Actions cell */}
                         <div className="flex justify-end gap-2">
                           {/* Edit Button triggers Dialog */}
                           <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(isOpen: boolean) => { if (!isOpen) { setIsEditDialogOpen(false); setEditingUser(null); } }}>
                             <DialogTrigger asChild>
                               <Button variant="ghost" size="icon" title="Edit User" onClick={() => handleEditClick(user)}>
                                 <Edit className="h-4 w-4" />
                               </Button>
                             </DialogTrigger>
                             {/* Dialog Content is rendered conditionally outside the loop later */}
                           </Dialog>
                           {/* Placeholder for Enable/Disable - will add handler later */}
                           <Button
                             variant="ghost"
                             size="icon"
                             title={user.isActive ? "Disable User" : "Enable User"}
                             onClick={() => handleToggleStatus(user.id, user.isActive)}
                             disabled={setUserStatusLoading} // Disable button while mutation is running
                           >
                             {user.isActive
                               ? <ToggleRight className="h-4 w-4 text-green-600" />
                               : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                           </Button>
                         </div>
                       </TableCell>
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

        {/* Edit User Dialog Content - Rendered outside the loop but controlled by state */}
        {editingUser && (
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User {editingUser.id}</DialogTitle>
              <DialogDescription>
                Make changes to the user's profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={editingUser.firstName ?? ''}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={editingUser.lastName ?? ''}
                  onChange={handleEditInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={editingUser.email ?? ''}
                  // onChange={handleEditInputChange} // Decide if email should be editable
                  readOnly // Assuming email is not editable for now
                  className="col-span-3 bg-gray-100"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: UserRole) => handleRoleChange(value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={'USER'}>USER</SelectItem> {/* Use string value */}
                    <SelectItem value={'ADMIN'}>ADMIN</SelectItem> {/* Use string value */}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="profileComplete" className="text-right col-span-3">
                   Profile Complete?
                 </Label>
                 <Checkbox
                   id="profileComplete"
                   checked={editingUser.profileComplete ?? false}
                   onCheckedChange={handleProfileCompleteChange}
                   className="justify-self-start"
                 />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingUser(null); }}>Cancel</Button>
              <Button type="button" onClick={handleEditSubmit} disabled={updateUserLoading}>
                {updateUserLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </div>
    </AdminRouteGuard>
  );
}

export default AdminUsersPage;