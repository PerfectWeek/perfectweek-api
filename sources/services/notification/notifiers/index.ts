export type NotificationData = {
    title: string;
    description: string;
    payload: any;
};

export interface INotifier {
    readonly id: string;

    notify(event: string, data: NotificationData): Promise<void>;
}
