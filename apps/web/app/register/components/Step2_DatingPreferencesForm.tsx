'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery, gql, useApolloClient } from '@apollo/client';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Removed RadioGroup
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { ME_QUERY } from '@/graphql/queries';
// Query to fetch partial preferences data
const GET_PARTIAL_USER_PREFERENCES_QUERY = gql`
  query GetPartialUserPreferences {
    getPartialUserPreferences {
      interestedInGenders
      ageRange
      distance
    }
  }
`;

// Mutation to save partial preferences data
const SAVE_USER_PREFERENCES_PARTIAL_MUTATION = gql`
  mutation SaveUserPreferencesPartial($input: UserPreferencesPartialInput!) {
    saveUserPreferencesPartial(input: $input) {
      success
    }
  }
`;

// Mutation for final preferences submission
const UPDATE_USER_PREFERENCES_MUTATION = gql`
  mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!) {
    updateUserPreferences(input: $input) {
      id
      registrationStep
    }
  }
`;

// TODO: Define based on actual preference fields (match backend schema)
// Example structure:
interface PreferencesFormData {
  interestedInGenders: string[]; // Changed name for clarity with multi-select
  ageRange: [number, number]; // e.g., [25, 40]
  distance: number; // e.g., 50 (in miles/km)
}

const Step2_DatingPreferencesForm: React.FC = () => {
  const { user } = useAuth();
  const client = useApolloClient();
  const [formData, setFormData] = useState<PreferencesFormData>({
    interestedInGenders: [],
    ageRange: [18, 55],
    distance: 50,
  });
  const [isLoadingPartial, setIsLoadingPartial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialSaveError, setPartialSaveError] = useState<string | null>(null);
  const [isSavingPartial, setIsSavingPartial] = useState<Record<string, boolean>>({});
  const [partialSaveSuccess, setPartialSaveSuccess] = useState<Record<string, boolean>>({});

  // Fetch partial preferences data
  const { loading: queryLoading } = useQuery(GET_PARTIAL_USER_PREFERENCES_QUERY, {
    onCompleted: (data) => {
      if (data?.getPartialUserPreferences) {
        const prefs = data.getPartialUserPreferences;
        setFormData({
          interestedInGenders: prefs.interestedInGenders || [],
          ageRange: prefs.ageRange || [18, 55],
          distance: prefs.distance || 50,
        });
      }
      setIsLoadingPartial(false);
    },
    onError: (err) => {
      console.error("Error fetching partial preferences:", err);
      setIsLoadingPartial(false);
    },
    fetchPolicy: 'network-only',
  });

  // Mutation to save partial preferences data
  const [savePartialPreferences] = useMutation(SAVE_USER_PREFERENCES_PARTIAL_MUTATION, {
    onCompleted: (data) => {
      if (data?.saveUserPreferencesPartial?.success) {
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
      console.error("Error saving partial preferences:", err);
      setPartialSaveError(`Failed to save changes: ${err.message}`);
      setIsSavingPartial({});
    }
  });

  // Final submission mutation hook
  const [submitPreferences, { loading: isSubmittingMutation }] = useMutation(UPDATE_USER_PREFERENCES_MUTATION, {
    onCompleted: (data) => {
      console.log("Preferences submitted successfully:", data);
      setError(null);
      // Refetch the ME_QUERY to update user state (including registrationStep)
      client.refetchQueries({
        include: [ME_QUERY],
      });
      // No need to setIsSubmitting(false) here, parent component will re-render
    },
    onError: (err) => {
      console.error("Error submitting preferences:", err);
      setError(err.message || "Failed to submit preferences. Please try again.");
      setIsSubmitting(false); // Keep form enabled on error
    }
  });

  // --- State Update Handlers ---

  const handleGenderChange = (gender: string, checked: boolean | 'indeterminate') => {
    // Handle indeterminate state if necessary, though unlikely for simple boolean checkbox
    if (checked === 'indeterminate') return;

    setFormData(prev => {
      const currentGenders = prev.interestedInGenders;
      let newGenders: string[];
      if (checked) {
        // Add gender if checked and not already present
        newGenders = currentGenders.includes(gender) ? currentGenders : [...currentGenders, gender];
      } else {
        // Remove gender if unchecked
        newGenders = currentGenders.filter(g => g !== gender);
      }
      return { ...prev, interestedInGenders: newGenders };
    });
    
    // Save partial data
    savePartialField('interestedInGenders', gender, checked);
  };

  // Save a partial field
  const savePartialField = (fieldName: string, value: any, isGender: boolean = false) => {
    setIsSavingPartial(prev => ({ ...prev, [fieldName]: true }));
    setPartialSaveError(null);
    
    let input: any = {};
    
    if (fieldName === 'interestedInGenders' && isGender) {
      // For gender checkboxes, we need to update the array
      input[fieldName] = formData.interestedInGenders.includes(value)
        ? formData.interestedInGenders.filter(g => g !== value)
        : [...formData.interestedInGenders, value];
    } else if (fieldName === 'ageRange') {
      input[fieldName] = value;
    } else if (fieldName === 'distance') {
      input[fieldName] = value;
    }
    
    savePartialPreferences({
      variables: {
        input,
        fieldName // Pass the field name for tracking in onCompleted
      }
    });
  };

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((fieldName: string, value: any) => {
      savePartialField(fieldName, value);
    }, 800),
    []
  );

  const handleAgeRangeChange = (value: number[]) => {
    // Slider component likely returns [min, max]
    // Add type guard for slider values
    if (typeof value[0] !== 'number' || typeof value[1] !== 'number') return;
    const newAgeRange: [number, number] = [value[0], value[1]];
    setFormData(prev => ({ ...prev, ageRange: newAgeRange }));
    
    // Debounced save
    debouncedSave('ageRange', newAgeRange);
  };

  const handleDistanceChange = (value: number[]) => {
    // Slider component likely returns [value]
    // Add type guard for slider value
    if (typeof value[0] !== 'number') return;
    const newDistance = value[0];
    setFormData(prev => ({ ...prev, distance: newDistance }));
    
    // Debounced save
    debouncedSave('distance', newDistance);
  };

  // --- Final Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
   setIsSubmitting(true); // Use local state to disable form immediately

   // --- Validation ---
   if (formData.interestedInGenders.length === 0) {
     setError("Please select at least one gender preference.");
     setIsSubmitting(false);
     return;
   }
   if (formData.ageRange[0] > formData.ageRange[1]) {
     setError("Minimum age cannot be greater than maximum age.");
     setIsSubmitting(false);
     return;
   }
    if (formData.distance <= 0) {
     setError("Maximum distance must be greater than 0.");
     setIsSubmitting(false);
     return;
   }
   // --- End Validation ---

   console.log("Submitting final preferences:", formData);

   // Map frontend state to the GraphQL input type
   // Assuming backend expects enum values like 'MALE', 'FEMALE', 'NON_BINARY'
   // Adjust mapping if backend expects different values (e.g., lowercase)
   const input = {
       preferredGenders: formData.interestedInGenders.map(g => g.toUpperCase()), // Example mapping
       minAgePreference: formData.ageRange[0],
       maxAgePreference: formData.ageRange[1],
       maxDistancePreference: formData.distance,
   };

   try {
       await submitPreferences({ variables: { input } });
       // On success, loading state is handled by parent via refetch triggering re-render
   } catch (mutationError) {
       // Error handling is done within the useMutation hook's onError
       console.error("Mutation submission failed:", mutationError);
       // Keep isSubmitting false due to error handled in onError
   }
 };

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
            <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Step 2: Dating Preferences</CardTitle>
        <CardDescription>Who are you looking to connect with?</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6"> {/* Increased spacing */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {partialSaveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>{partialSaveError}</AlertDescription>
            </Alert>
          )}

          {/* Interested in Gender */}
          <div className="space-y-2">
           <Label>I'm interested in connecting with:</Label>
           {/* Using Checkbox for multiple selections */}
           <div className="space-y-2 pt-1">
             {['Female', 'Male', 'Non-binary'].map((gender) => ( // Removed 'Everyone' as it's covered by selecting others
               <div key={gender} className="flex items-center space-x-2">
                 <Checkbox
                   id={`gender-${gender}`}
                   checked={formData.interestedInGenders.includes(gender)}
                   onCheckedChange={(checked) => handleGenderChange(gender, checked)}
                   disabled={isSubmitting || isSubmittingMutation}
                 />
                 <Label htmlFor={`gender-${gender}`} className="font-normal">
                   {gender === 'Female' ? 'Women' : gender === 'Male' ? 'Men' : 'Non-binary people'}
                 </Label>
               </div>
             ))}
           </div>
         </div>

          {/* Age Range */}
          <div className="space-y-2">
            <Label htmlFor="ageRange">Age Range</Label>
            <Slider
              id="ageRange"
              min={18}
              max={99} // Adjust max as needed
              step={1}
              value={formData.ageRange}
              onValueChange={handleAgeRangeChange} // Use onValueChange for continuous update
              // onValueCommit={handleAgeRangeCommit} // Use this if saving only on release
             disabled={isSubmitting || isSubmittingMutation}
              className="pt-2" // Add padding top for better spacing
            />
            <div className="text-sm text-muted-foreground text-center">
              {formData.ageRange[0]} - {formData.ageRange[1]} years old
            </div>
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <Label htmlFor="distance">Maximum Distance</Label>
             <Slider
              id="distance"
              min={1} // e.g., 1 mile/km
              max={200} // Adjust max as needed
              step={1}
              value={[formData.distance]} // Slider expects array
              onValueChange={handleDistanceChange}
             disabled={isSubmitting || isSubmittingMutation}
              className="pt-2"
            />
             <div className="text-sm text-muted-foreground text-center">
              Up to {formData.distance} miles away {/* Adjust unit */}
            </div>
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
         <Button type="submit" disabled={isSubmitting || isSubmittingMutation}>
           {isSubmitting || isSubmittingMutation ? 'Saving...' : 'Save & Continue'}
         </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default Step2_DatingPreferencesForm;
// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}