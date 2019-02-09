const BITBOXSDK = require('bitbox-light/lib/bitbox-sdk');
const bitbox = new BITBOXSDK.default();

if (typeof global !== "undefined") {
  (global as any).bitbox = bitbox;
}
