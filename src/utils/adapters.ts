import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';

export const convertMwIO =
  (middleware: Function) => (socket: Socket, next: (err?: ExtendedError | undefined) => void) =>
    middleware(socket, {}, next);
