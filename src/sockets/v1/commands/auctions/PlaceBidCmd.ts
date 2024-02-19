import * as SocketIO from 'socket.io';
import { Command } from '../interface';
import { auctionService } from '../../../../services';
import { serverEmitted } from '../../events';

export class PlaceBidCmd implements Command {
  private socket: SocketIO.Socket;

  private io: SocketIO.Server;

  constructor(socket: SocketIO.Socket, io: SocketIO.Server) {
    this.socket = socket;
    this.io = io;
  }

  async execute(bid: string, cb: Function) {
    const { userId, email } = this.socket.data;
    if (Number.isNaN(+bid)) {
      return this.socket.emit('error', { message: 'Invalid Data' });
    }

    if (!this.socket.data.auctionId) {
      return this.socket.emit('error', { message: 'You are not in any auction' });
    }
    // check if bid is the highest
    try {
      await auctionService.bid({
        auctionId: this.socket.data.auctionId,
        userId,
        bidAmount: +bid,
      });

      cb({ success: true });
    } catch (error: any) {
      return this.socket.emit('error', { message: error.message });
    }

    return this.io
      .to(this.socket.data.auctionId.toString())
      .emit(serverEmitted.AUCTION_RECEIVE_BID, {
        user: {
          id: userId,
          email,
        },
        bidAmount: bid,
      });
  }
}
