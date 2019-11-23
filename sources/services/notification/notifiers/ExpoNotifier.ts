import Expo from "expo-server-sdk";

import { INotifier, NotificationData } from ".";

export class ExpoNotifier implements INotifier {
    constructor(
        private readonly expo: Expo,
        public readonly id: string,
    ) { }

    public async notify(data: NotificationData): Promise<void> {
        await this.expo.sendPushNotificationsAsync([{
            to: this.id,
            title: data.title,
            body: data.description,
            data: data,
        }]);
    }

    public static readonly createFactory = (expo: Expo) => (expoId: string): ExpoNotifier => {
        return new ExpoNotifier(expo, expoId);
    }
}

export type ExpoNotifierFactory = (expoId: string) => ExpoNotifier;
