import SimpleBitcoinDatabase from "./lib/SimpleBitcoinDatabase";

const BITBOXSDK = require('bitbox-sdk');
const BITBOX = new BITBOXSDK.default();

export default SimpleBitcoinDatabase;

if (typeof global !== "undefined") {
  (global as any).SimpleWallet = SimpleBitcoinDatabase;
}

if (typeof global !== "undefined") {
  (global as any).bitbox = BITBOX;
}
