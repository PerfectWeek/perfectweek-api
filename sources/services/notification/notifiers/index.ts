export type NotificationData = {
    eventType: string;
    title: string;
    description: string;
    payload: any;
};

export interface INotifier {
    readonly id: string;

    notify(data: NotificationData): Promise<void>;
}
