export type GoogleProviderPayload = {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;

    googleCalendarListSyncToken?: string;
    syncedGoogleCalendars: { [key: string]: number };
};
