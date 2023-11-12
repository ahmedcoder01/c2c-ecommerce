const serverEmitted = {
  AUCTION_START: 'auction:start',
  AUCTION_END: 'auction:end',
  AUCTION_RECEIVE_BID: 'auction:receive-bid',
  AUCTION_SEND_BID_LOG: 'auction:send-bid-log',
};

const clientEmitted = {
  AUCTION_JOIN: 'auction:join',
  AUCTION_LEAVE: 'auction:leave',
  AUCTION_BID: 'auction:bid',
};

export { serverEmitted, clientEmitted };
