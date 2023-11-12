import { EventEmitter } from 'stream';
import logger from '../logger';
import { auctionService } from '../services';
import { TimerManager } from '../utils/Timer.util';

type AuctionsEventTypes =
  | 'scheduleAuctionStart'
  | 'scheduleAuctionEnd'
  | 'broadcastAuctionStart'
  | 'broadcastAuctionEnd';

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
    const pendingAuctions = await auctionService.listNotEndedAuctions();

    pendingAuctions.forEach(product => {
      const now = new Date();
      const hasAlreadyStarted = new Date(product.auctionStartDate) <= now;
      const hasAlreadyEnded = new Date(product.auctionEndDate) <= now;

      if (hasAlreadyStarted && !hasAlreadyEnded) {
        auctionService.markBiddingProductAsStarted(product.id);
        this.emit('scheduleAuctionEnd', {
          auctionId: product.id,
          endAt: product.auctionEndDate,
        });
      } else if (!hasAlreadyStarted && !hasAlreadyEnded) {
        this.emit('scheduleAuctionStart', {
          auctionId: product.id,
          startAt: product.auctionStartDate,
        });

        this.emit('scheduleAuctionEnd', {
          auctionId: product.id,
          endAt: product.auctionEndDate,
        });
      } else if (hasAlreadyStarted && hasAlreadyEnded) {
        auctionService.endAuctionAndChooseWinner(product.id);
      }
    });

    logger.info(`AUCTIONS: Replaying ${pendingAuctions.length} auctions timers...`);
    return this;
  }
}

const auctionsManager = new AuctionManager();

auctionsManager.on(
  'scheduleAuctionStart',
  ({ auctionId, startAt }: { auctionId: number; startAt: string }) => {
    //
    auctionsManager.timer.setTimer(
      `${auctionId}-start`,
      new Date(startAt).getTime() - Date.now(),
      async () => {
        logger.info(`AUCTIONS: Auction ${auctionId} started`);
        await auctionService.markBiddingProductAsStarted(auctionId);
        auctionsManager.emit('broadcastAuctionStart', { auctionId });
      },
    );
  },
);

auctionsManager.on(
  'scheduleAuctionEnd',
  ({ auctionId, endAt }: { auctionId: number; endAt: string }) => {
    //
    auctionsManager.timer.setTimer(
      `${auctionId}-end`,
      new Date(endAt).getTime() - Date.now(),
      async () => {
        logger.info(`AUCTIONS: Auction ${auctionId} ended`);
        await auctionService.endAuctionAndChooseWinner(auctionId);
        auctionsManager.emit('broadcastAuctionEnd', { auctionId });
      },
    );
  },
);

export default auctionsManager;
