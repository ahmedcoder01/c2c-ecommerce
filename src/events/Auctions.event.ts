import { EventEmitter } from 'stream';
import logger from '../logger';
import { sellerProductService } from '../services';
import { TimerManager } from '../utils/Timer.util';

type AuctionsEventTypes = 'scheduleAuctionStart' | 'scheduleAuctionEnd';

class AuctionManager extends EventEmitter {
  public timer: TimerManager;

  constructor() {
    super();
    this.timer = new TimerManager();
  }

  emit(event: AuctionsEventTypes, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  on(event: AuctionsEventTypes, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  async replayRegisteredAuctions(): Promise<this> {
    const pendingAuctions = await sellerProductService._listNotEndedBiddingProducts();

    pendingAuctions.forEach(product => {
      const now = new Date();
      const hasAlreadyStarted = new Date(product.auctionStartDate) <= now;
      const hasAlreadyEnded = new Date(product.auctionEndDate) <= now;

      if (hasAlreadyStarted && !hasAlreadyEnded) {
        sellerProductService._sys.markBiddingProductAsStarted(product.id);
        this.emit('scheduleAuctionEnd', {
          aProductId: product.id,
          endAt: product.auctionEndDate,
        });
      } else if (!hasAlreadyStarted && !hasAlreadyEnded) {
        this.emit('scheduleAuctionStart', {
          aProductId: product.id,
          startAt: product.auctionStartDate,
        });

        this.emit('scheduleAuctionEnd', {
          aProductId: product.id,
          endAt: product.auctionEndDate,
        });
      } else if (hasAlreadyStarted && hasAlreadyEnded) {
        sellerProductService._sys.markBiddingProductAsEnded(product.id);
        // TODO: broadcast to all clients
      }
    });

    logger.info(`AUCTIONS: Replaying ${pendingAuctions.length} auctions timers...`);
    return this;
  }
}

const auctionsManager = new AuctionManager();

auctionsManager.on(
  'scheduleAuctionStart',
  ({ aProductId, startAt }: { aProductId: number; startAt: string }) => {
    //
    auctionsManager.timer.setTimer(
      `${aProductId}-start`,
      new Date(startAt).getTime() - Date.now(),
      () => {
        logger.info(`AUCTIONS: Auction ${aProductId} started`);
        sellerProductService._sys.markBiddingProductAsStarted(aProductId);
      },
    );
  },
);

auctionsManager.on(
  'scheduleAuctionEnd',
  ({ aProductId, endAt }: { aProductId: number; endAt: string }) => {
    //
    auctionsManager.timer.setTimer(
      `${aProductId}-end`,
      new Date(endAt).getTime() - Date.now(),
      async () => {
        logger.info(`AUCTIONS: Auction ${aProductId} ended`);
        await sellerProductService._sys.markBiddingProductAsEnded(aProductId);
      },
    );
  },
);

export default auctionsManager;
