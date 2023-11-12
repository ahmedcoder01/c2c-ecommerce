import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Server as SocketIOServer } from 'socket.io';
import { convertMwIO } from '../../utils/adapters';
import { requireAuth, requireAuthIO } from '../../middlewares/auth.middleware';
import logger from '../../logger';
import handlers from './handlers';

export class SocketRegistry {
  private io: SocketIOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  constructor(io: SocketIOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    this.io = io;
  }

  public bindEvents() {
    this.io.use(requireAuthIO);

    this.io.on('connection', socket => {
      //  handler(socket, this.io);
      for (const Handler of handlers) {
        new Handler(socket, this.io).handle();
      }
    });
  }
}
