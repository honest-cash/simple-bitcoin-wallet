const BITBOXSDK = require('bitbox-sdk').BITBOX;
const bitbox = new BITBOXSDK();

if (typeof global !== "undefined") {
  (global as any).bitbox = bitbox;
}
