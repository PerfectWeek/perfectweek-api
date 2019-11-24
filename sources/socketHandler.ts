import SocketIo from "socket.io";

import { UserRepository } from "./models/UserRepository";
import { decodeUserToken, JwtService } from "./services/JwtService";
import { NotificationService } from "./services/notification/NotificationService";
import { SocketNotifierFactory } from "./services/notification/notifiers/SocketNotifier";

//
// Perform authentication
//
const onAuth = (
    // Socket
    socket: SocketIo.Socket,
    // Repositories
    userRepository: UserRepository,
    // Services
    jwtService: JwtService,
    notificationService: NotificationService,
    socketNotifierFactory: SocketNotifierFactory,
) => async (
    payload: { token: string },
    ): Promise<void> => {
        const { token } = payload;

        // Validate token
        const userId = decodeUserToken(jwtService, token);
        if (!userId) {
            socket.emit("exception", "Invalid token");
            return;
        }

        // Retrieve User's information
        const user = await userRepository.getUserById(userId);
        if (!user) {
            // Should normally not happen
            socket.emit("exception", "Could not retrieve User information");
            return;
        }

        // Register notifier
        const socketNotifier = socketNotifierFactory(socket);
        notificationService.addNotifier(userId, socketNotifier);
    };

export const socketHandler = (
    // Repositories
    userRepository: UserRepository,
    // Services
    jwtService: JwtService,
    notificationService: NotificationService,
    socketNotifierFactory: SocketNotifierFactory,
) => (
    io: SocketIo.Server,
    ): void => {
        io.on("connect", (socket: SocketIo.Socket) => {
            socket.on(
                "authenticate",
                onAuth(socket, userRepository, jwtService, notificationService, socketNotifierFactory),
            );
        });
    };
