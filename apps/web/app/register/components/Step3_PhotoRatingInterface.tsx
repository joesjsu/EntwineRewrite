import React, { useState, useEffect, useContext } from 'react';
import { gql, useQuery, useMutation, ApolloClient, useApolloClient } from '@apollo/client';
import { useAuth } from '@/context/AuthContext'; // Use the custom hook
import { ME_QUERY } from '@/graphql/queries';

// --- Shadcn UI Imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // Optional progress indicator
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react"; // Loading spinner

// --- GraphQL Operations (Placeholders - Define actual queries/mutations based on schema) ---

// Placeholder Type for a photo object - adjust based on actual schema
interface RatingPhoto {
  id: string;
  url: string;
  // Add other relevant fields if needed
}

// Query to fetch photos and saved ratings
const GET_PHOTOS_FOR_RATING = gql`
  query GetPhotosForRating($limit: Int) {
    getPhotosForRating(limit: $limit) {
      id
      url
      # Include other fields returned by the query
    }
  }
`;

// Query to fetch saved photo ratings
const GET_SAVED_PHOTO_RATINGS_QUERY = gql`
  query GetSavedPhotoRatings {
    getSavedPhotoRatings {
      photoId
      rating
    }
  }
`;

// Mutation to save a single photo rating (intra-step saving)
const SAVE_PHOTO_RATING_MUTATION = gql`
  mutation SavePhotoRating($input: PhotoRatingInput!) {
    savePhotoRating(input: $input) {
      success
      photoId
    }
  }
`;

// Mutation to submit all ratings and complete the step
const SUBMIT_PHOTO_RATINGS_MUTATION = gql`
  mutation SubmitPhotoRatings {
    submitPhotoRatings {
      success
      registrationStep
    }
  }
`;

// --- Component ---

export const Step3_PhotoRatingInterface: React.FC = () => {
  const { user } = useAuth(); // Use the custom hook to get context value
  const client = useApolloClient(); // Get Apollo client instance for refetching

  const [photos, setPhotos] = useState<RatingPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [errorPhotos, setErrorPhotos] = useState<string | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [errorRating, setErrorRating] = useState<string | null>(null);
  const [totalRated, setTotalRated] = useState(0); // Track how many rated in this session
  const [photosToRateCount, setPhotosToRateCount] = useState(10); // Example: Aim to rate 10 photos initially
  const [savedRatings, setSavedRatings] = useState<Record<string, number>>({});
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  // --- Fetch Photos Query ---
  const { loading: queryLoading, error: queryError, data: queryData, refetch: refetchPhotos } = useQuery<{ getPhotosForRating: RatingPhoto[] }>(
    GET_PHOTOS_FOR_RATING,
    {
      variables: { limit: photosToRateCount }, // Fetch a batch of photos
      fetchPolicy: 'network-only', // Ensure fresh data
      onCompleted: (data) => {
        if (data?.getPhotosForRating?.length > 0) {
          setPhotos(data.getPhotosForRating);
          setCurrentIndex(0);
          setErrorPhotos(null);
        } else {
          // Handle case where no photos are returned initially (maybe step already complete?)
          // The parent component should handle navigation based on registrationStep,
          // but we might want some feedback here.
          setPhotos([]);
        }
        setIsLoadingPhotos(false);
      },
      onError: (error) => {
        console.error("Error fetching photos:", error);
        setErrorPhotos(`Failed to load photos: ${error.message}`);
        setIsLoadingPhotos(false);
        setPhotos([]);
      },
    }
  );

  // --- Submit Rating Mutation ---
  // Mutation to save a single photo rating (intra-step saving)
  const [saveRating, { loading: savingRating }] = useMutation(SAVE_PHOTO_RATING_MUTATION, {
    onCompleted: (data) => {
      if (data?.savePhotoRating?.success) {
        const photoId = data.savePhotoRating.photoId;
        
        // Update savedRatings
        setSavedRatings(prev => ({
          ...prev,
          [photoId]: currentRating
        }));
        
        console.log(`Rating saved for photo ${photoId}`);
        setErrorRating(null);
        
        // Move to the next photo
        if (currentIndex < photos.length - 1) {
          setCurrentIndex(prevIndex => prevIndex + 1);
        } else {
          // Reached the end of the current batch
          console.log("Finished current batch of photos.");
          
          // Show completion UI
          setPhotos([]); // Clear photos to show completion/waiting state
          setIsLoadingPhotos(false);
        }
      }
      setIsSubmittingRating(false);
    },
    onError: (error) => {
      console.error("Error saving rating:", error);
      setErrorRating(`Failed to save rating: ${error.message}`);
      setIsSubmittingRating(false);
    }
  });
  
  // Mutation to submit all ratings and complete the step
  const [submitAllRatings, { loading: submittingAll }] = useMutation(SUBMIT_PHOTO_RATINGS_MUTATION, {
    onCompleted: async (data) => {
      if (data?.submitPhotoRatings?.success) {
        console.log("All ratings submitted successfully");
        
        // Refetch user data to update registrationStep
        try {
          await client.refetchQueries({
            include: [ME_QUERY],
          });
          console.log("User data refetched.");
        } catch (refetchError) {
          console.error("Error refetching user data:", refetchError);
        }
      }
      setIsSubmittingFinal(false);
    },
    onError: (error) => {
      console.error("Error submitting all ratings:", error);
      setErrorRating(`Failed to complete photo ratings: ${error.message}`);
      setIsSubmittingFinal(false);
    }
  });
  
  // Track current rating for the current photo
  const [currentRating, setCurrentRating] = useState<number | null>(null);

  // Effect to set current rating when changing photos
  useEffect(() => {
    if (photos.length > 0 && currentIndex < photos.length && photos[currentIndex]) {
      const photoId = photos[currentIndex].id;
      if (savedRatings[photoId] !== undefined) {
        setCurrentRating(savedRatings[photoId]);
      } else {
        setCurrentRating(null);
      }
    }
  }, [currentIndex, photos, savedRatings]);

  // --- Event Handlers ---
  const handleRate = (rating: number) => {
    if (isSubmittingRating || photos.length === 0 || currentIndex >= photos.length) return;

    const currentPhoto = photos[currentIndex];
    if (!currentPhoto) return;

    setCurrentRating(rating);
    setIsSubmittingRating(true);
    setErrorRating(null); // Clear previous rating errors

    saveRating({
      variables: {
        input: {
          photoId: currentPhoto.id,
          rating: rating, // 1 for Like, 0 for Dislike
        }
      },
    });
  };
  
  // Handle final submission
  const handleCompleteRatings = () => {
    if (isSubmittingFinal || Object.keys(savedRatings).length === 0) return;
    
    setIsSubmittingFinal(true);
    setErrorRating(null);
    
    submitAllRatings();
  };

  // --- Render Logic ---

  // Initial Loading State
  if (isLoadingPhotos && photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading photos to rate...</p>
      </div>
    );
  }

  // Error Loading Photos
  if (errorPhotos && photos.length === 0) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorPhotos}</AlertDescription>
      </Alert>
    );
  }

   // No photos left or finished batch (waiting for navigation)
   if (photos.length === 0 && !isLoadingPhotos && !errorPhotos) {
     return (
       <div className="flex flex-col items-center justify-center p-6">
         {/* You might show a completion message or just a loader while waiting */}
         <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
         <p className="text-muted-foreground">Processing ratings, please wait...</p>
         {/* Or: <p>Photo rating complete! Waiting for next step...</p> */}
       </div>
     );
   }
// No photos available but we have saved ratings - show completion UI
if (photos.length === 0 && Object.keys(savedRatings).length > 0) {
    return (
        <Card className="w-full max-w-md mx-auto p-6">
            <CardHeader>
                <CardTitle>Photo Rating Complete</CardTitle>
                <CardDescription>
                    You've rated {Object.keys(savedRatings).length} photos. Thank you!
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="mb-4">You can now proceed to the next step.</p>
                <Button
                    onClick={handleCompleteRatings}
                    disabled={isSubmittingFinal}
                    className="w-full"
                >
                    {isSubmittingFinal ? 'Completing...' : 'Complete & Continue'}
                </Button>
            </CardContent>
        </Card>
    );
}

// No photos available (e.g., step completed before UI loaded fully)
if (photos.length === 0) {
    return (
        <div className="p-6 text-center">
            <p className="text-muted-foreground">No photos available for rating at the moment.</p>
            {/* Optionally add a button to manually refetch or check status */}
        </div>
    );
}



  const currentPhoto = photos[currentIndex];

  return (
    <div className="flex flex-col items-center p-4 md:p-6 space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Rate Photos</h2>
      <p className="text-muted-foreground text-center">
        Help us understand your preferences by rating these photos.
      </p>

      {/* Optional Progress Indicator */}
      {photos.length > 0 && (
         <div className="w-full max-w-md">
            <Progress value={((currentIndex + 1) / photos.length) * 100} className="w-full" />
            <p className="text-sm text-muted-foreground text-center mt-1">
                Photo {currentIndex + 1} of {photos.length} (Batch)
            </p>
         </div>
      )}


      <Card className="w-full max-w-md overflow-hidden">
        <CardHeader>
          <CardTitle>Rate this Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center aspect-square p-0">
          {/* Display current photo */}
          {currentPhoto ? (
            <img
              src={currentPhoto.url}
              alt="Photo to rate"
              className="object-cover w-full h-full" // Adjust styling as needed
            />
          ) : (
            // Should ideally not happen if photos array is checked, but good fallback
            <div className="flex items-center justify-center h-full bg-muted">
              <p className="text-muted-foreground">No photo loaded</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-around p-4">
          {/* Rating Buttons */}
          <Button
            variant={currentRating === 0 ? "default" : "outline"}
            size="lg"
            onClick={() => handleRate(0)} // 0 for Dislike
            disabled={isSubmittingRating || !currentPhoto}
            className={`border-red-500 ${currentRating === 0 ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-red-50 hover:text-red-600'} flex-1 mx-2`}
          >
            {isSubmittingRating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Dislike
          </Button>
          <Button
            variant={currentRating === 1 ? "default" : "outline"}
            size="lg"
            onClick={() => handleRate(1)} // 1 for Like
            disabled={isSubmittingRating || !currentPhoto}
            className={`border-green-500 ${currentRating === 1 ? 'bg-green-500 text-white' : 'text-green-500 hover:bg-green-50 hover:text-green-600'} flex-1 mx-2`}
          >
            {isSubmittingRating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Like
          </Button>
        </CardFooter>
      </Card>

      {/* Rating Submission Error */}
      {errorRating && (
        <Alert variant="destructive" className="w-full max-w-md mt-4">
          <AlertTitle>Rating Error</AlertTitle>
          <AlertDescription>{errorRating}</AlertDescription>
        </Alert>
      )}
       {/* Display mutation loading state subtly if needed, though button disable might be enough */}
       {/* {isSubmittingRating && <p className="text-sm text-muted-foreground">Submitting...</p>} */}
    </div>
  );
};

// Export the component for use in the registration page
export default Step3_PhotoRatingInterface;