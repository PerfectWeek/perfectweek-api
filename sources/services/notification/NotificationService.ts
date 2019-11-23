import { INotifier, NotificationData } from "./notifiers/index";

export class NotificationService {
    private readonly usersNotifiers: Map<number, INotifier[]>;

    constructor(
    ) {
        this.usersNotifiers = new Map();
    }

    public async notifyUser(userId: number, data: NotificationData): Promise<void[]> {
        const userNotifiers = this.usersNotifiers.get(userId);
        if (!userNotifiers) {
            return Promise.all([]);
        }

        return Promise.all(userNotifiers.map(n => n.notify(data)));
    }

    public addNotifier(userId: number, notifier: INotifier): void {
        const existingEntries = this.usersNotifiers.get(userId);

        // Check if this is the first notifier for this User
        if (!existingEntries) {
            // Create new notifier
            this.usersNotifiers.set(userId, [notifier]);
            return;
        }

        // Find existing duplicate for this Notifier
        const existingEntryIndex = existingEntries.findIndex(n => n.id === notifier.id);
        if (existingEntryIndex !== -1) {
            // Replace the existing one
            existingEntries[existingEntryIndex] = notifier;
            return;
        }

        // Add the new notifier
        existingEntries.push(notifier);
    }

    public removeNotifier(notifierId: string): void {
        // Iterate over all Users and notifiers to find and remove it
        for (const userEntries of this.usersNotifiers.values()) {
            const indexToRemove = userEntries.findIndex(n => n.id === notifierId);
            if (indexToRemove !== -1) {
                userEntries.splice(indexToRemove, 1);
            }
        }
    }
}
