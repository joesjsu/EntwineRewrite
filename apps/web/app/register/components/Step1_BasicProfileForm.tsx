'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery, gql, useApolloClient } from '@apollo/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ME_QUERY } from '@/graphql/queries'; // Import ME_QUERY
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Skeleton import
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

// Query to fetch partial profile data
const GET_PARTIAL_USER_PROFILE_QUERY = gql`
  query GetPartialUserProfile {
    getPartialUserProfile {
      birthday
      location
      bio
      photoUrl
    }
  }
`;

// Mutation to save partial profile data
const SAVE_USER_PROFILE_PARTIAL_MUTATION = gql`
  mutation SaveUserProfilePartial($input: UserProfilePartialInput!) {
    saveUserProfilePartial(input: $input) {
      success
    }
  }
`;

// Mutation for final profile submission
const UPDATE_USER_PROFILE_MUTATION = gql`
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      id
      registrationStep
    }
  }
`;

interface ProfileFormData {
  // TODO: Define based on actual user profile fields
  birthday: string;
  location: string;
  bio: string;
  // photoUrl: string; // Photo handled separately
}

const Step1_BasicProfileForm: React.FC = () => {
  const { user } = useAuth(); // Removed refetchUser again
  const client = useApolloClient();
  const [formData, setFormData] = useState<ProfileFormData>({
    birthday: '',
    location: '',
    bio: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null); // Existing photo URL from backend
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Preview URL for newly selected file
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof ProfileFormData | 'photo', string>>>({});
  const [isLoadingPartial, setIsLoadingPartial] = useState(true);
  const [isSavingPartial, setIsSavingPartial] = useState<Record<string, boolean>>({});
  const [partialSaveError, setPartialSaveError] = useState<string | null>(null);
  const [partialSaveSuccess, setPartialSaveSuccess] = useState<Record<string, boolean>>({});

  // Fetch partial profile data
  const { loading: queryLoading } = useQuery(GET_PARTIAL_USER_PROFILE_QUERY, {
    onCompleted: (data) => {
      if (data?.getPartialUserProfile) {
        const profile = data.getPartialUserProfile;
        setFormData({
          birthday: profile.birthday || '',
          location: profile.location || '',
          bio: profile.bio || '',
        });
        if (profile.photoUrl) {
          setPhotoUrl(profile.photoUrl);
        }
      }
      setIsLoadingPartial(false);
    },
    onError: (err) => {
      console.error("Error fetching partial profile:", err);
      setIsLoadingPartial(false);
    },
    fetchPolicy: 'network-only',
  });

// Mutation to save partial profile data
const [savePartialProfile] = useMutation(SAVE_USER_PROFILE_PARTIAL_MUTATION, {
  onCompleted: (data) => {
    if (data?.saveUserProfilePartial?.success) {
      // Show success indicator for the field
      setPartialSaveSuccess(prev => ({ ...prev, [data.fieldName]: true }));
      // Clear success indicator after 2 seconds
      setTimeout(() => {
        setPartialSaveSuccess(prev => ({ ...prev, [data.fieldName]: false }));
      }, 2000);
    }
    setIsSavingPartial(prev => ({ ...prev, [data.fieldName]: false }));
  },
  onError: (err) => {
    console.error("Error saving partial profile:", err);
    setPartialSaveError(`Failed to save changes: ${err.message}`);
    setIsSavingPartial({});
  }
});

  const [submitProfile, { loading: submitting, error: submissionError }] = useMutation(UPDATE_USER_PROFILE_MUTATION, {
     onCompleted: (data) => {
       console.log("Profile submitted successfully:", data);
       // Refetch the ME_QUERY to update the user context
       client.refetchQueries({
         include: [ME_QUERY],
       });
       setIsSubmitting(false); // Redundant if using 'loading' state from hook
       // Navigation to next step is handled by the parent page.tsx reacting to the updated user context
     },
     onError: (err) => {
       console.error("Error submitting profile:", err);
       setError(`Failed to submit profile: ${err.message}`);
       // setIsSubmitting(false); // Redundant if using 'loading' state from hook
      },
      // Removed explicit setIsSubmitting(false) calls, rely on 'submitting' state from hook
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for the field being changed
    if (validationErrors[name as keyof ProfileFormData]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Debounced save on change
    debouncedSave(name, value);
  };

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((fieldName: string, value: string) => {
      savePartialField(fieldName, value);
    }, 800),
    []
  );

  // Handle blur event for immediate save
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (value.trim()) {
      savePartialField(name, value);
    }
  };

  // Save a single field
  const savePartialField = (fieldName: string, value: string) => {
    if (!value.trim()) return;
    
    setIsSavingPartial(prev => ({ ...prev, [fieldName]: true }));
    setPartialSaveError(null);
    
    savePartialProfile({
      variables: {
        input: {
          [fieldName]: value
        },
        fieldName // Pass the field name for tracking in onCompleted
      }
    });
  };


  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Photo selected:", file.name);
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Create preview URL
      setPhotoUrl(null); // Clear existing photo URL if a new file is selected
      // Clear validation error for photo if present
      if (validationErrors.photo) {
        setValidationErrors(prev => ({ ...prev, photo: undefined }));
      }
      // TODO: Implement actual upload logic later if needed for this step
    } else {
      setPhotoFile(null);
      setPreviewUrl(null); // Clear preview if selection is cancelled
    }
  };

  // Clean up the object URL when the component unmounts or the preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Validation function
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ProfileFormData | 'photo', string>> = {};
    let isValid = true;

    if (!formData.birthday) {
      errors.birthday = 'Birthday is required.';
      isValid = false;
    } else {
       // Basic date check (can be improved)
       if (isNaN(Date.parse(formData.birthday))) {
         errors.birthday = 'Invalid date format.';
         isValid = false;
       } else if (new Date(formData.birthday) > new Date()) {
         errors.birthday = 'Birthday cannot be in the future.';
         isValid = false;
       }
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required.';
      isValid = false;
    }

    if (!formData.bio.trim()) {
      errors.bio = 'Bio is required.';
      isValid = false;
    }

    // Example: Make photo required (optional based on requirements)
    // if (!photoFile) {
    //   errors.photo = 'Profile photo is required.';
    //   isValid = false;
    // }

    setValidationErrors(errors);
    return isValid;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.preventDefault(); // Already here, just confirming
    setError(null); // Clear previous submission errors
    setValidationErrors({}); // Clear previous validation errors

    if (!validateForm()) {
      console.log("Form validation failed:", validationErrors);
      return; // Stop submission if validation fails
    }

    setIsSubmitting(true); // Keep this for consistency, though 'submitting' from hook is primary
    if (!user?.id) {
      setError("User not authenticated.");
      setIsSubmitting(false);
      return;
    }
    console.log("Submitting final profile data:", formData);
    try {
      await submitProfile({
        variables: {
          input: {
            // Assuming input structure matches ProfileFormData
            // The backend mutation resolver should handle mapping this to the User model
            // and updating registrationStep
            birthday: formData.birthday,
            location: formData.location,
            bio: formData.bio,
            // userId: user.id // Pass userId if required by mutation input type explicitly
            // Photo handling is separate for now
          }
        }
      });
      // On success, onCompleted handler will run
    } catch (err) {
      // onError handler will run, but catch block is good practice
      console.error("Caught submission error:", err);
      // Error state is already set by onError handler
      // Error state is set by onError handler
      setIsSubmitting(false); // Reset manual submitting flag
    }
  };

  // Removed isLoadingPartial check and Skeleton loading state
// Render loading skeleton
if (isLoadingPartial) {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
      </CardHeader>
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
          <div className="h-24 w-full bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    </Card>
  );
}

return (
  <Card className="w-full max-w-lg mx-auto">
    <CardHeader>
      <CardTitle>Step 1: Basic Profile</CardTitle>
      <CardDescription>Tell us a bit about yourself to get started.</CardDescription>
    </CardHeader>
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {(error || submissionError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || submissionError?.message}</AlertDescription>
          </Alert>
        )}
        {partialSaveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>{partialSaveError}</AlertDescription>
          </Alert>
        )}
          {/* Removed partialSaveError Alert */}
          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              value={formData.birthday}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              disabled={submitting}
              aria-invalid={!!validationErrors.birthday}
              aria-describedby={validationErrors.birthday ? "birthday-error" : undefined}
            />
            {validationErrors.birthday && <p id="birthday-error" className="text-sm text-red-600 mt-1">{validationErrors.birthday}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              type="text"
              placeholder="City, State"
              value={formData.location}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              disabled={submitting}
              aria-invalid={!!validationErrors.location}
              aria-describedby={validationErrors.location ? "location-error" : undefined}
            />
            {validationErrors.location && <p id="location-error" className="text-sm text-red-600 mt-1">{validationErrors.location}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Write a short bio..."
              value={formData.bio}
              onChange={handleInputChange}
              onBlur={handleBlur}
              required
              rows={4}
              disabled={submitting}
              aria-invalid={!!validationErrors.bio}
              aria-describedby={validationErrors.bio ? "bio-error" : undefined}
            />
            {validationErrors.bio && <p id="bio-error" className="text-sm text-red-600 mt-1">{validationErrors.bio}</p>}
          </div>
          {/* Modern Photo Upload UI */}
          <div className="space-y-2">
            <Label htmlFor="profilePhoto">Profile Photo</Label>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <input
                type="file"
                id="profilePhoto"
                name="profilePhoto"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={submitting}
                aria-invalid={!!validationErrors.photo}
                aria-describedby={validationErrors.photo ? "photo-error" : undefined}
                // required // Make required if needed
              />
              <label htmlFor="profilePhoto" className="cursor-pointer block">
                {previewUrl || photoUrl ? (
                  <div className="relative mx-auto w-32 h-32 mb-4">
                    <img
                      src={previewUrl || photoUrl || ''} // Show preview first, then existing photo
                      alt={previewUrl ? "Preview" : "Current profile photo"}
                      className="w-32 h-32 rounded-full object-cover border"
                    />
                    {/* Optional: Add an overlay icon for changing photo */}
                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 mb-4">
                    {/* Placeholder Icon (Example using SVG) */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-muted-foreground">
                      Click or drag file to this area to upload
                    </p>
                    <p className="text-xs text-muted-foreground/80">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
                <span className="text-sm text-primary font-medium">
                  {previewUrl || photoUrl ? 'Change Photo' : 'Upload Photo'}
                </span>
              </label>
            </div>
            {validationErrors.photo && <p id="photo-error" className="text-sm text-red-600 mt-1">{validationErrors.photo}</p>}
            {photoFile && !previewUrl && <p className="text-sm text-muted-foreground mt-1">Selected: {photoFile.name}</p>} {/* Fallback if preview fails */}
          </div>
          
          {/* Saving indicators */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(isSavingPartial).map(([field, saving]) =>
              saving && (
                <div key={field} className="text-xs flex items-center text-muted-foreground">
                  <span className="animate-spin mr-1">⟳</span> Saving {field}...
                </div>
              )
            )}
            {Object.entries(partialSaveSuccess).map(([field, success]) =>
              success && (
                <div key={field} className="text-xs flex items-center text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" /> {field} saved
                </div>
              )
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Save & Continue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default Step1_BasicProfileForm;
// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}