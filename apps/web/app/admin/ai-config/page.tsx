'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import {
  useGetAiFeatureConfigsQuery,
  useUpdateAiFeatureConfigMutation,
  useGetAvailableAiProvidersQuery,
  AiFeatureConfig,
  GetAiFeatureConfigsDocument,
  AvailableAiProvider,
} from '@/graphql/generated';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type EditableConfig = Omit<AiFeatureConfig, '__typename'>;

export default function AiConfigPageWrapper() {
  return (
    <AdminRouteGuard>
      <AiConfigPageContent />
    </AdminRouteGuard>
  );
}

function AiConfigPageContent() {
  // --- Hooks ---
  const {
    data: configData,
    loading: configLoading,
    error: configError,
    refetch: refetchConfigs
  } = useGetAiFeatureConfigsQuery();

  const {
    data: providersData,
    loading: providersLoading,
    error: providersError
  } = useGetAvailableAiProvidersQuery();

  const [
    updateConfig,
    { loading: mutationLoading, error: mutationError }, // Keep global mutationLoading for general disabling
  ] = useUpdateAiFeatureConfigMutation();

  // --- State ---
  const [configs, setConfigs] = useState<EditableConfig[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingSaveKey, setPendingSaveKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null); // Track the key currently being saved

  // --- Effects ---
  useEffect(() => {
    if (configData?.getAiFeatureConfigs) {
      setConfigs(configData.getAiFeatureConfigs.map((config: AiFeatureConfig) => {
        const { __typename, ...rest } = config; return rest;
      }));
    }
  }, [configData]);

  // --- Memoized Data ---
  const availableProviders = useMemo(() => providersData?.getAvailableAiProviders || [], [providersData]);
  const providerOptions = useMemo(() => availableProviders.map(p => p.providerName), [availableProviders]);
  const modelMap = useMemo(() => {
    const map: { [key: string]: string[] } = {};
    availableProviders.forEach(p => {
      map[p.providerName] = p.models;
    });
    return map;
  }, [availableProviders]);

  // --- Event Handlers ---
  const handleProviderChange = (featureKey: string, newProvider: string) => {
    setConfigs(currentConfigs =>
      currentConfigs.map(config =>
        config.featureKey === featureKey
          ? { ...config, providerName: newProvider, modelName: '' }
          : config
      )
    );
  };

  const handleModelChange = (featureKey: string, newModel: string) => {
    setConfigs(currentConfigs =>
      currentConfigs.map(config =>
        config.featureKey === featureKey ? { ...config, modelName: newModel } : config
      )
    );
  };

  const handleOpenConfirmDialog = (featureKey: string) => {
    setPendingSaveKey(featureKey);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSaveChanges = async () => {
    if (!pendingSaveKey) return;

    const configToSave = configs.find(c => c.featureKey === pendingSaveKey);
    if (!configToSave) return;

    setIsConfirmDialogOpen(false);
    setSavingKey(pendingSaveKey); // Set the key that is currently being saved

    try {
      const result = await updateConfig({
        variables: {
          input: {
            featureKey: configToSave.featureKey,
            providerName: configToSave.providerName,
            modelName: configToSave.modelName,
          },
        },
        refetchQueries: [{ query: GetAiFeatureConfigsDocument }],
        awaitRefetchQueries: true,
      });

      if (result.data?.updateAiFeatureConfig) {
        toast.success(`Configuration for ${pendingSaveKey} updated.`);
      } else {
         throw new Error("Update mutation did not return expected data.");
      }
    } catch (err: any) {
      console.error("Failed to update config:", err);
      toast.error(`Update Failed: Could not update ${pendingSaveKey}`, {
        description: err.message || 'Unknown error',
      });
    } finally {
       setPendingSaveKey(null);
       setSavingKey(null); // Clear the saving key when done (success or error)
    }
  };

  // --- Render Logic ---
  const isLoading = configLoading || providersLoading;
  const queryError = configError || providersError;

  if (isLoading) {
    // ... loading state ...
     return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Configurations...</span>
      </div>
    );
  }

  if (queryError) {
    // ... error state ...
     return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            Failed to fetch configurations or providers: {queryError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (configs.length === 0) {
    // ... no data state ...
     return (
       <div className="container mx-auto p-4">
        <Alert>
          <AlertTitle>No Config Data</AlertTitle>
          <AlertDescription>
            No AI feature configurations found. Seed the database or check API.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pendingConfig = configs.find(c => c.featureKey === pendingSaveKey);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Feature Configuration</h1>
      <p className="mb-4">Manage the AI providers and models used for different application features.</p>

      {mutationError && (
         <Alert variant="destructive" className="mb-4">
          <AlertTitle>Update Error</AlertTitle>
          <AlertDescription>
            Failed to save configuration: {mutationError.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {/* ... table header ... */}
             <TableRow>
              <TableHead>Feature Key</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => {
              const isSavingThisRow = savingKey === config.featureKey;
              return (
                <TableRow key={config.featureKey}>
                  <TableCell className="font-medium">{config.featureKey}</TableCell>
                  <TableCell>
                    {/* ... Provider Select ... */}
                     <Select
                      value={config.providerName}
                      onValueChange={(value) => handleProviderChange(config.featureKey, value)}
                      disabled={isSavingThisRow} // Disable select while saving this row
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providerOptions.length > 0 ? (
                          providerOptions.map(provider => (
                            <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No providers available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {/* ... Model Select ... */}
                     <Select
                      value={config.modelName}
                      onValueChange={(value) => handleModelChange(config.featureKey, value)}
                      disabled={!config.providerName || isSavingThisRow} // Disable if no provider or saving
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {(modelMap[config.providerName] || []).length > 0 ? (
                          (modelMap[config.providerName] || []).map(model => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            {config.providerName ? 'No models found' : 'Select provider first'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(config.updatedAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {/* Update Button onClick and disabled logic */}
                    <Button
                      size="sm"
                      onClick={() => handleOpenConfirmDialog(config.featureKey)}
                      disabled={mutationLoading || !config.modelName} // Disable if any mutation is running or no model selected
                    >
                      {isSavingThisRow ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} {/* Show spinner only for this row */}
                      {isSavingThisRow ? 'Saving...' : 'Save'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Save Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the configuration for feature{' '}
              <strong>{pendingConfig?.featureKey}</strong> to use provider{' '}
              <strong>{pendingConfig?.providerName}</strong> and model{' '}
              <strong>{pendingConfig?.modelName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSaveKey(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSaveChanges}
              disabled={mutationLoading} // Disable confirm button if any mutation is running
            >
              {/* Show spinner in confirm button if this specific row is saving */}
              {savingKey === pendingSaveKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}