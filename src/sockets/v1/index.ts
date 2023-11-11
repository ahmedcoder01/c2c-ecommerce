import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Server as SocketIOServer } from 'socket.io';
import { convertMwIO } from '../../utils/adapters';
import { requireAuth } from '../../middlewares/auth.middleware';
import logger from '../../logger';

export class SocketRegistry {
  private io: SocketIOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;

  constructor(io: SocketIOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    this.io = io;
  }

  public bindEvents() {
    this.io.use(convertMwIO(requireAuth));

    this.io.on('connection', socket => {
      logger.info('connected an authenticated user');
    });
  }
}
