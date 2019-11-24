import Http from "http";

import SocketIo from "socket.io";

export class SocketService {
    private io?: SocketIo.Server;

    constructor() {
        this.io = undefined;
    }

    public readonly deferredInit = (
        httpServer: Http.Server,
        socketLoader: (io: SocketIo.Server) => void,
    ): void => {
        this.io = SocketIo(httpServer);
        socketLoader(this.io);
    }
}
