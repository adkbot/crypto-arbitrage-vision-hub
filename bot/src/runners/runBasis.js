const { runBasis } = require('../strategies/basisArbitrage');
const { cfg } = require('../config');
(async () => {
  const c = cfg();
  for (const sym of c.risk.symbols) runBasis(sym, { spot: c.spot.wss, fut: c.fut.wss });
})();