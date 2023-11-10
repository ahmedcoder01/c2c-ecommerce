import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Server as SocketIOServer } from 'socket.io';

export class SocketRegistry {
  private io: SocketIOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null;

  constructor(
    io: SocketIOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null,
  ) {
    this.io = io;
  }

  public bindEvents() {}
}
