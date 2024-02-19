import { Command } from '../interface';
import { auctionService } from '../../../../services';
import * as SocketIO from 'socket.io';
import { serverEmitted } from '../../events';

export class JoinAuctionCmd implements Command {
  private socket: SocketIO.Socket;

  private io: SocketIO.Server;

  constructor(socket: SocketIO.Socket, io: SocketIO.Server) {
    this.socket = socket;
    this.io = io;
  }

  async execute(auctionId: string): Promise<any> {
    if (!auctionId) {
      return this.socket.emit('error', { message: 'Invalid Data' });
    }
    // check if auction product exists
    const auction = await auctionService.getAuction(auctionId);
    if (!auction) {
      return this.socket.emit('error', { message: 'Auction not found' });
    }

    if (auction.auctionEndDate < new Date()) {
      return this.socket.emit('error', { message: 'Auction has already ended' });
    }

    if (this.socket.data.auctionId) {
      // is already in an auction, leave it
      this.socket.leave(this.socket.data.auctionId.toString());
    }
    this.socket.join(auctionId.toString());
    this.socket.data.auctionId = auctionId;
    return true;
  }
}
