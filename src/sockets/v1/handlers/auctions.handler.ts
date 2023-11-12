import * as SocketIO from 'socket.io';
import { SocketIOHandler } from './socketHandler';
import { clientEmitted, serverEmitted } from '../events';
import { auctionService } from '../../../services';

export class AuctionHandler implements SocketIOHandler {
  private socket: SocketIO.Socket;

  private io: SocketIO.Server;

  constructor(socket: SocketIO.Socket, io: SocketIO.Server) {
    this.socket = socket;
    this.io = io;
  }

  handle() {
    this.socket.on(clientEmitted.AUCTION_JOIN, this.joinAuction.bind(this));
    this.socket.on(clientEmitted.AUCTION_BID, this.bid.bind(this));
  }

  private async joinAuction(auctionId: string) {
    const _auctionId = +auctionId;
    if (!auctionId || Number.isNaN(_auctionId)) {
      return this.socket.emit('error', { message: 'Invalid Data' });
    }
    // check if auction product exists
    const productExists = await auctionService.isAuctionProductExists(_auctionId);

    if (!productExists) {
      return this.socket.emit('error', { message: 'Product not found' });
    }

    if (this.socket.data.auctionId) {
      this.socket.leave(this.socket.data.auctionId.toString());
    }
    this.socket.join(auctionId.toString());
    this.socket.data.auctionId = _auctionId;
    return true;
  }

  private async bid(bid: string) {
    const { userId } = this.socket.data;
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
    } catch (error: any) {
      console.log(error);
      return this.socket.emit('error', { message: error.message });
    }

    return this.io
      .to(this.socket.data.auctionId.toString())
      .emit(serverEmitted.AUCTION_RECEIVE_BID, {
        userId,
        bidAmount: bid,
      });
  }
}
