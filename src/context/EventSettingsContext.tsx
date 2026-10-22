import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { eventConfig, EventConfig } from '../config/eventConfig';
import { fetchPublicAlbumStatus, PublicAlbumStatus } from '../services/albumApiService';

interface EventSettingsContextValue {
  config: EventConfig;
  albumStatus: PublicAlbumStatus;
  loadingStatus: boolean;
  refreshStatus: () => Promise<void>;
}

const defaultAlbumStatus: PublicAlbumStatus = {
  backendConfigured: false,
  galleryOpen: false,
  submissionsOpen: false,
  submissionsCloseAt: null,
  requireFamilyCodeForGallery: false,
  requireFamilyCodeForUpload: true,
  maxFilesPerSubmission: eventConfig.uploadLimits.maxFilesPerSubmission,
  maxFileSizeMb: eventConfig.uploadLimits.maxFileSizeMb,
  retentionDays: 365,
  customEventDetails: null,
};

const EventSettingsContext = createContext<EventSettingsContextValue>({
  config: eventConfig,
  albumStatus: defaultAlbumStatus,
  loadingStatus: true,
  refreshStatus: async () => {},
});

export const EventSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [albumStatus, setAlbumStatus] = useState<PublicAlbumStatus>(defaultAlbumStatus);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const refreshStatus = useCallback(async () => {
    try {
      const data = await fetchPublicAlbumStatus();
      setAlbumStatus(data);
    } catch {
      // Keep default fallback when offline
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const mergedConfig: EventConfig = React.useMemo(() => {
    const custom = albumStatus.customEventDetails;
    if (!custom) return eventConfig;

    return {
      ...eventConfig,
      parentsNames:
        custom.parentsNames && custom.parentsNames.length > 0
          ? custom.parentsNames
          : eventConfig.parentsNames,
      eventStart: custom.eventStart || eventConfig.eventStart,
      eventEnd: custom.eventEnd || eventConfig.eventEnd,
      timeZone: custom.timeZone || eventConfig.timeZone,
      venueName: custom.venueName || eventConfig.venueName,
      address: custom.address || eventConfig.address,
      mapsUrl: custom.mapsUrl || eventConfig.mapsUrl,
      dressCode: custom.dressCode || eventConfig.dressCode,
      accessNotes: custom.accessNotes || eventConfig.accessNotes,
      portraitUrl: custom.portraitUrl || eventConfig.portraitUrl,
      uploadLimits: {
        ...eventConfig.uploadLimits,
        maxFilesPerSubmission:
          albumStatus.maxFilesPerSubmission || eventConfig.uploadLimits.maxFilesPerSubmission,
        maxFileSizeMb:
          albumStatus.maxFileSizeMb || eventConfig.uploadLimits.maxFileSizeMb,
      },
    };
  }, [albumStatus]);

  return (
    <EventSettingsContext.Provider
      value={{
        config: mergedConfig,
        albumStatus,
        loadingStatus,
        refreshStatus,
      }}
    >
      {children}
    </EventSettingsContext.Provider>
  );
};

export function useEventSettings() {
  return useContext(EventSettingsContext);
}
