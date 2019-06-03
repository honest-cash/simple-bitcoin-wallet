import SimpleBitcoinDatabase from "./lib/SimpleBitcoinDatabase";

const BITBOXSDK = require('bitbox-sdk').BITBOX;
const BITBOX = new BITBOXSDK();

export default SimpleBitcoinDatabase;

if (typeof global !== "undefined") {
  (global as any).SimpleWallet = SimpleBitcoinDatabase;
}

if (typeof global !== "undefined") {
  (global as any).bitbox = BITBOX;
}
