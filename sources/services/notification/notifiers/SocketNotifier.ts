import SocketIo from "socket.io";
import Uuid from "uuid/v4";

import { INotifier, NotificationData } from ".";

export class SocketNotifier implements INotifier {
    constructor(
        private readonly socket: SocketIo.Socket,
        public readonly id: string,
    ) { }

    public async notify(data: NotificationData): Promise<void> {
        this.socket.emit(data.eventType, data);
    }

    public static readonly createFactory = () => (socket: SocketIo.Socket): SocketNotifier => {
        const socketId = `Socket[${Uuid()}]`;
        return new SocketNotifier(socket, socketId);
    }
}

export type SocketNotifierFactory = (socket: SocketIo.Socket) => SocketNotifier;
