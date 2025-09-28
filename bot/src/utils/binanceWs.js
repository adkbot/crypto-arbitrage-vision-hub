const WebSocket = require('ws');
function connectWss(baseUrl, stream, onMsg){
  const ws = new WebSocket(`${baseUrl}/${stream}`);
  ws.on('message', buf=>{try{ onMsg(JSON.parse(buf.toString())); }catch(){}});
  ws.on('ping', d=>ws.pong(d));
  ws.on('error', e=>console.error('WSS', e.message));
  ws.on('close', () => setTimeout(()=>connectWss(baseUrl, stream, onMsg), 1500));
  return ws;
}
module.exports = { connectWss };