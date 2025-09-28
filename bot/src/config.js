require('dotenv/config');
const isProd = process.env.ENV === 'prod';
function cfg(){
  return {
    env: process.env.ENV || 'dev',
    port: Number(process.env.PORT || 8787),
    spot: {
      api: isProd ? 'https://api.binance.com' : (process.env.SPOT_API_URL || 'https://testnet.binance.vision'),
      wss: isProd ? 'wss://stream.binance.com:9443/ws' : (process.env.SPOT_STREAM_URL || 'wss://testnet.binance.vision/ws'),
      key: process.env.SPOT_API_KEY,
      secret: process.env.SPOT_API_SECRET
    },
    fut: {|n
      api: isProd ? 'https://fapi.binance.com' : (process.env.FUT_API_URL || 'https://testnet.binancefuture.com'),
      wss: isProd ? 'wss://ws-fapi.binance.com/ws-fapi/v1' : (process.env.FUT_WSS_URL || 'wss://testnet.binancefuture.com/ws-fapi/v1'),
      key: process.env.FUT_API_KEY,
      secret: process.env.FUT_API_SECRET
    },
    risk: {
      baseUsdt: Number(process.env.BASE_USDT || 50),
      minEdgeBps: Number(process.env.MIN_EDGE_BPS || 8),
      takerFeeSpot: Number(process.env.TAKER_FEE_SPOT || 0.001),
      takerFeeFut: Number(process.env.TAKER_FEE_FUT || 0.0004),
      symbols: (process.env.SYMBOLS || 'BTCUSDT,ETHESUSTT').split(',').map(s => s.trim().toUpperCase())
    }
  };
}
module.exports = { cfg };
