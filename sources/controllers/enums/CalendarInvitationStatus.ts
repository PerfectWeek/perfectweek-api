export enum CalendarInvitationStatus {
    Pending = "pending",
    Confirmed = "confirmed",
}

export function calendarInvitationStatusFromString(status: string): CalendarInvitationStatus | undefined {
    switch (status) {
        case CalendarInvitationStatus.Confirmed: return CalendarInvitationStatus.Confirmed;
        case CalendarInvitationStatus.Pending: return CalendarInvitationStatus.Pending;
        default: return undefined;
    }
}
