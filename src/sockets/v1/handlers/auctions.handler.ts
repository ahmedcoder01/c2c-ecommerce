import * as SocketIO from 'socket.io';
import { SocketIOHandler } from './socketHandler';
import { clientEmitted, serverEmitted } from '../events';
import { auctionService } from '../../../services';
import auctionsManager from '../../../events/Auctions.event';
import logger from '../../../logger';
import { JoinAuctionCmd } from '../commands/auctions/JoinAuctionCmd';
import { PlaceBidCmd } from '../commands/auctions/PlaceBidCmd';

export class AuctionHandler implements SocketIOHandler {
  private socket: SocketIO.Socket;

  private io: SocketIO.Server;

  constructor(socket: SocketIO.Socket, io: SocketIO.Server) {
    this.socket = socket;
    this.io = io;
  }

  handle() {
    const joinAuctionCmd = new JoinAuctionCmd(this.socket, this.io);
    const placeBidCmd = new PlaceBidCmd(this.socket, this.io);

    this.socket.on(clientEmitted.AUCTION_JOIN, (auctionId: string) =>
      joinAuctionCmd.execute(auctionId),
    );
    this.socket.on(clientEmitted.AUCTION_BID, (bid: string, cb: Function) =>
      placeBidCmd.execute(bid, cb),
    );

    auctionsManager.on('broadcastAuctionStart', ({ auctionId }) => {
      logger.info(`Broadcasting auction start for auction ${auctionId}`);
      this.io.to(auctionId.toString()).emit(serverEmitted.AUCTION_START);
    });

    auctionsManager.on(
      'broadcastAuctionEnd',
      ({
        auctionId,
        winner,
      }: {
        auctionId: number;
        winner: { email: string; id: string } | null;
      }) => {
        logger.info(`Broadcasting auction end for auction ${auctionId}`);
        this.io.to(auctionId.toString()).emit(serverEmitted.AUCTION_END, { winner });
      },
    );
  }
}
