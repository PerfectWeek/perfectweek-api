enum CalendarInvitationStatus {
    Pending = "pending",
    Confirmed = "confirmed"
}


export function parseCalendarInvitationStatus(status: string): CalendarInvitationStatus | undefined {
    switch (status) {
        case CalendarInvitationStatus.Confirmed: return CalendarInvitationStatus.Confirmed;
        case CalendarInvitationStatus.Pending: return CalendarInvitationStatus.Pending;
        default: return undefined;
    }
}


export default CalendarInvitationStatus;
