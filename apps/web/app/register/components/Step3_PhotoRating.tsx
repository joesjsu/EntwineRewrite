'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery } from '@apollo/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ThumbsUp, ThumbsDown, SkipForward } from "lucide-react"; // Icons for buttons
import Image from 'next/image'; // Use Next.js Image for optimization

// TODO: Define actual GraphQL queries/mutations
const GET_RATING_PHOTOS_QUERY = {} as any; // Placeholder - Should return array of { id: string, url: string }
const SAVE_PHOTO_RATING_MUTATION = {} as any; // Placeholder - Input: { photoId: string, rating: 'like' | 'dislike' | 'skip' }
const SUBMIT_PHOTO_RATINGS_MUTATION = {} as any; // Placeholder (Final submission for the step)

interface Photo {
  id: string;
  url: string;
}

interface Rating {
  photoId: string;
  rating: 'like' | 'dislike' | 'skip';
}

const Step3_PhotoRating: React.FC = () => {
  const { user } = useAuth(); // Need explicit ME_QUERY refetch or cache update on submit
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [ratings, setRatings] = useState<Rating[]>([]); // Store ratings locally if needed, or rely purely on backend saves
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // TODO: Implement actual query fetching for photos
  // const { loading: loadingPhotos, error: photosError } = useQuery(GET_RATING_PHOTOS_QUERY, {
  //    variables: { limit: 10 }, // Example limit
  //    onCompleted: (data) => {
  //      if (data?.getRatingPhotos) {
  //        setPhotos(data.getRatingPhotos);
  //        // TODO: Potentially fetch saved ratings here too to prevent re-rating? Or backend handles this.
  //      }
  //      setIsLoadingPhotos(false);
  //    },
  //    onError: (err) => {
  //      console.error("Error fetching photos:", err);
  //      setError("Failed to load photos for rating.");
  //      setIsLoadingPhotos(false);
  //    }
  // });

   // Placeholder effect to simulate loading photos
   useEffect(() => {
    console.log("Step 3: Fetching photos...");
    const timer = setTimeout(() => {
        // Simulate setting fetched data
        setPhotos([
            { id: 'photo1', url: '/placeholder-image.jpg' }, // Replace with actual URLs or placeholders
            { id: 'photo2', url: '/placeholder-image.jpg' },
            { id: 'photo3', url: '/placeholder-image.jpg' },
            { id: 'photo4', url: '/placeholder-image.jpg' },
            { id: 'photo5', url: '/placeholder-image.jpg' },
        ]);
        setIsLoadingPhotos(false);
        console.log("Step 3: Photos loaded (simulated).");
    }, 800);
    return () => clearTimeout(timer);
  }, []);


  // TODO: Implement actual rating save mutation
  const [saveRating] = useMutation(SAVE_PHOTO_RATING_MUTATION, {
    onError: (err) => {
      console.error("Error saving rating:", err);
      setRatingError("Failed to save your rating. Please try again.");
      setIsSavingRating(false);
    },
     onCompleted: () => {
       console.log("Rating saved successfully.");
       setRatingError(null);
       // Move to next photo automatically after successful save
       goToNextPhoto();
       setIsSavingRating(false); // Ensure state is reset
    }
  });

  // TODO: Implement actual final submission mutation for the step
  const [submitRatingsStep] = useMutation(SUBMIT_PHOTO_RATINGS_MUTATION, {
     onCompleted: (data) => {
       console.log("Photo rating step submitted successfully, updating user step...");
       // TODO: Implement ME_QUERY refetch or configure mutation cache update
       setIsSubmitting(false);
     },
     onError: (err) => {
       console.error("Error submitting photo rating step:", err);
       setError("Failed to complete this step. Please try again.");
       setIsSubmitting(false);
     }
  });

  const goToNextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    } else {
      // Last photo rated, trigger final submission for the step
      console.log("All photos rated. Submitting step...");
      handleFinalSubmit();
    }
  };

  const handleRate = (rating: 'like' | 'dislike' | 'skip') => {
    if (isSavingRating || isSubmitting || !photos[currentPhotoIndex]) return;

    const currentPhotoId = photos[currentPhotoIndex].id;
    console.log(`Rating photo ${currentPhotoId} as ${rating}`);
    setIsSavingRating(true);
    setRatingError(null);

    // TODO: Call actual saveRating mutation
    // saveRating({ variables: { input: { photoId: currentPhotoId, rating } } });
     // Simulate API call
     setTimeout(() => {
        console.log(`Simulated save complete for rating: ${rating}`);
        // Add rating locally if needed for UI state, though backend is source of truth
        setRatings(prev => [...prev, { photoId: currentPhotoId, rating }]);
        goToNextPhoto(); // Go to next photo after simulated success
        setIsSavingRating(false);
     }, 500);
  };

  const handleFinalSubmit = () => {
     if (isSubmitting) return;
     setIsSubmitting(true);
     setError(null);
     console.log("Submitting photo rating step...");
     // TODO: Call actual submitRatingsStep mutation
     // submitRatingsStep();
      // Simulate API call
      setTimeout(() => {
        console.log("Simulated final step submission complete.");
        // TODO: Trigger user refetch / cache update
        setIsSubmitting(false);
     }, 1000);
  };

  const currentPhoto = photos[currentPhotoIndex];

  // --- Render Logic ---
  if (isLoadingPhotos) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
           <Skeleton className="h-6 w-3/4" />
           <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
           <Skeleton className="h-64 w-full" /> {/* Placeholder for image */}
           <Skeleton className="h-4 w-1/4" /> {/* Placeholder for progress */}
        </CardContent>
        <CardFooter className="flex justify-around">
           <Skeleton className="h-10 w-16" />
           <Skeleton className="h-10 w-16" />
           <Skeleton className="h-10 w-16" />
        </CardFooter>
      </Card>
    );
  }

  if (!currentPhoto && !isLoadingPhotos && photos.length > 0) {
     // This case means we finished all photos, show loading/completion state
     return (
        <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
                <CardTitle>Step 3: Photo Rating</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Completing photo ratings...</p>
                {/* Optionally show a spinner */}
            </CardContent>
        </Card>
     );
  }

   if (photos.length === 0 && !isLoadingPhotos) {
     return (
        <Card className="w-full max-w-md mx-auto text-center">
            <CardHeader>
                <CardTitle>Step 3: Photo Rating</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No photos available for rating at this moment.</p>
                {/* Provide a way to proceed or retry? */}
                 <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="mt-4">
                    {isSubmitting ? 'Submitting...' : 'Continue'}
                 </Button>
            </CardContent>
        </Card>
     );
   }


  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Step 3: Photo Rating</CardTitle>
        <CardDescription>Help us understand your preferences by rating these photos.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
         {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {ratingError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Rating Error</AlertTitle>
              <AlertDescription>{ratingError}</AlertDescription>
            </Alert>
          )}

        {/* Image Display */}
        <div className="relative w-full aspect-square overflow-hidden rounded-md bg-muted">
           {currentPhoto ? (
             <Image
               src={currentPhoto.url}
               alt={`Photo ${currentPhotoIndex + 1}`}
               fill // Use fill layout
               style={{ objectFit: 'cover' }} // Ensure image covers the area
               priority={true} // Prioritize loading the current image
               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes
             />
           ) : (
             <div className="flex items-center justify-center h-full">
                <p>Loading photo...</p>
             </div>
           )}
        </div>

        {/* Progress Indicator */}
        <p className="text-sm text-muted-foreground">
            Photo {currentPhotoIndex + 1} of {photos.length}
        </p>

      </CardContent>
      <CardFooter className="flex justify-around">
        {/* Rating Buttons */}
        <Button
            variant="outline"
            size="icon"
            onClick={() => handleRate('dislike')}
            disabled={isSavingRating || isSubmitting}
            aria-label="Dislike"
        >
            <ThumbsDown className="h-5 w-5" />
        </Button>
         <Button
            variant="outline"
            size="icon"
            onClick={() => handleRate('skip')}
            disabled={isSavingRating || isSubmitting}
            aria-label="Skip"
        >
            <SkipForward className="h-5 w-5" />
        </Button>
        <Button
            variant="outline"
            size="icon"
            onClick={() => handleRate('like')}
            disabled={isSavingRating || isSubmitting}
            aria-label="Like"
        >
            <ThumbsUp className="h-5 w-5" />
        </Button>
      </CardFooter>
       {isSavingRating && <p className="text-sm text-muted-foreground text-center pb-4">Saving rating...</p>}
    </Card>
  );
};

export default Step3_PhotoRating;