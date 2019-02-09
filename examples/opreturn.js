const SimpleWallet = require("../dist/simpleBitcoinDatabase.min.js").default;

const simpleWallet = new SimpleWallet("");

(async () => {
    const outputs = [
        {
            address: "bitcoincash:qrymesaa598jel4f2p7s3r5g8th8y9jdnvypacg4pc",
            amountSat: 100
        },
        {
            opReturn: ["0x6d02", "Hello world!"]
        },
    ];

    const tx = await simpleWallet.send(outputs);
    console.log(tx);
})();
