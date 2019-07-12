# Simple Bitcoin Wallet
[![Build Status](https://travis-ci.com/honest-cash/simple-bitcoin-wallet.svg?branch=master)](https://travis-ci.com/honest-cash/simple-bitcoin-wallet)

For web developers building applications for Bitcoin Cash, Simple Wallet provides an easy and quick way to create BCH wallets and send bitcoin around. simple-bitcoin-wallet gives developers high-level interfaces that hides most of the complexity required for such functionality. The mission is to make interaction with Bitcoin Cash Blockchain as simple as possible.

Simple Wallet is used for <a href="https://honest.cash" target="_blank">Honest.Cash</a>. It uses Bitbox and rest.bitcoin.com.

The default derivation path for the wallet keypair is m/44'/0'/0'/0/0.

# Functionality
* Create wallets

* Send Transactions (1:n fund distribution possible!)

* Upload and Download data from the blockchain (deprecated)

* Support for encryption of recovery phrases

## How to use it?

### Import
#### Add to your HTML scripts
```js
<script src="https://honest.cash/js/simple-bitcoin-wallet.min.js"></script>
```

#### Node module
```bash
npm install simple-bitcoin-wallet --save
```

```js
// module import
import SimpleWallet from "simple-bitcoin-wallet";

// nodejs modules
const SimpleWallet = require("simple-bitcoin-wallet");
```

### Create new wallets
```js
const simpleWallet = new SimpleWallet();

// 12 words seed phrase for the wallet
console.log(simpleWallet.mnemonic);

// cash address derived from the seed (derivation path: m/44'/0'/0'/0/0)
console.log(simpleWallet.cashAddress);

// legacy address derived from the seed (derivation path: m/44'/0'/0'/0/0)
console.log(simpleWallet.legacyAddress);

// private key for the BCH address derived from the seed (derivation path: m/44'/0'/0'/0/0)
console.log(simpleWallet.privateKey);
```

### Mnemonic encryption
```js
const simpleWallet = new SimpleWallet(null, {
  password: "myStrongPassword"
});

// 12 words seed phrase for the wallet
console.log(simpleWallet.mnemonic);

// encrypted mnemonic
console.log(simpleWallet.mnemonicEncrypted);

const simpleWallet2 = new SimpleWallet(simpleWallet.mnemonicEncrypted, {
  password: "myStrongPassword"
});

// decrypted mnemonic
console.log(simpleWallet.mnemonic);
```

### Initialize wallet with mnemonic
```js
// initialize with 12 words seed phrase for the wallet
const simpleWallet = new SimpleWallet("minor bench until split suffer shine series bag avoid cruel orient aunt");

// initialize for specific HD derivation path
const simpleWallet2 = new SimpleWallet("minor bench until split suffer shine series bag avoid cruel orient aunt", {
    HdPath: "m/44'/0'/0'/1'"
});
```

### Send transactions
You can send funds to other BCH wallets. You can distribute funds to N users by simply extending the receiver array.
```js
const simpleWallet = new SimpleWallet("minor bench until split suffer shine series bag avoid cruel orient aunt");

const receivers = [
    {
        address: "bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h",
        // amount in satoshis, 1 satoshi = 0.00000001 Bitcoin
        amountSat: 100000
    }
];

const tx = await simpleWallet.send(receivers);

// Transaction ID
// you can then see the transaction in one of the explorers
// example: `https://explorer.bitcoin.com/bch/tx/${tx.txid}`;
console.log(tx.txid);
```

### Send OP_RETURN transaction
You can include any OP_RETURN data outputs to your `receivers` array when sending a transaction.
The OP_RETURN data is included using an array of strings. The strings are utf8 by default, but can be interpreted as hex by prepending the string with '0x'.
This allows you to use applications with an OP_RETURN protocol, such as memo.cash.
```js
const simpleWallet = new SimpleWallet("minor bench until split suffer shine series bag avoid cruel orient aunt");

const receivers = [
    {
        address: "bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h",
        // amount in satoshis, 1 satoshi = 0.00000001 Bitcoin
        amountSat: 100000
    },
    {
        // Post memo containing the text "Hello world!"
        opReturn: ["0x6d02", "Hello world!"]
    }
];

const tx = await simpleWallet.send(receivers);

// Transaction ID
// you can then see the transaction in one of the explorers
// example: `https://explorer.bitcoin.com/bch/tx/${tx.txid}`;
console.log(tx.txid);
```

### getBalance(bchAddress?: string): Promise<number>
Gets balance (confirmed + unconfirmed) for an BCH address

```js
// will get a balance for simpleWallet.cashAddress
const myBalance = await simpleWallet.getBalance();

// will get a balance for any address
const balanceOfOtherAddress = await simpleWallet.getBalance("bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h");
```

### Get full address info
```js
// will get a balance for simpleWallet.cashAddress
const myWalletInfo = await simpleWallet.getWalletInfo();

// will get a balance for any address
const walletInfoOfOtherAddress = await simpleWallet.getWalletInfo("bitcoincash:qp2rmj8heytjrksxm2xrjs0hncnvl08xwgkweawu9h");
/**
{
    balance: 0.00373518
    balanceSat: 373518
    cashAddress: "bitcoincash:qrlhkg4d9z3y88j246a6482xzregxaxnfsagmd2kh3"
    legacyAddress: "1QHrpX426kFvoxRNPZh9aW5Qve5emndARr"
    totalReceived: 0.15087197
    totalReceivedSat: 15087197
    totalSent: 0.14713679
    totalSentSat: 14713679
    transactions: [ "txId1", "txId2" ]
    txApperances: 2
    unconfirmedBalance: 0
    unconfirmedBalanceSat: 0
    unconfirmedTxApperances: 0
}
*/
```

### Upload and download stuff on Bitcoin Cash
You can save and retrieve data on the Bitcoin Cash blockchain using the BitcoinFiles protocol.
This is fullt integrated into simple-bitcoin-wallet.

```js
const simpleWallet = new SimpleWallet("minor bench until split suffer shine series bag avoid cruel orient aunt");

// any data is allowed
const data = {
    title: "Hello wordl",
    body: "Hello world",
    author: "honest_cash"
};

// meta is optional
const meta = {
    title: "hello wordl",
    extUri: "https://honest.cash"
};

const { fileId } = await simpleWallet.upload(data, meta);

// 3 sec later request the file.
setTimeout(async () => {
    const result = await simpleWallet.download(fileId);

    console.log(result);
}, 3000);
```

### Error Handling
```js
try {
    tx = await simpleWallet.send([
        { address: "bitcoincash:qrlhkg4d9z3y88j246a6482xzregxaxnfsagmd2kh3", amountSat: 1000 }
    ]);
} catch (err) {
    console.error(err);

    if (err.message && err.message.indexOf("Insufficient") > -1) {
        return alert("Insufficient balance on your BCH account.");
    }

    return alert("Error. Try again later.");
}
```

### Save keys in the browser
While developing BCH apps, remember to never send the private keys / mnemonic / seed phrase to your servers.
1. Your servers can be hacked
2. Depending on your jurisdiction you may not have the allowance to manage the funds of your users
```js
const simpleWallet1 = new SimpleWallet();

// save the mnemonic for later
localStorage.setItem("BCH_MNEMONIC", simpleWallet.mnemonic);

// retrieve mnemonic to initialize the wallet
const simpleWallet2 = new SimpleWallet(localStorage.getItem("BCH_MNEMONIC"));
```

# Under the hood
* Simple wallet is a wallet implemented for <a href="https://honest.cash">honest.cash</a>. It combines functionality of multiple libraries and recombines them in a way that makes it simple for developers to begin working with Bitcoin Cash blockchain.

* Simple Bitcoin Wallet is powered by <a href="https://www.npmjs.com/package/bitbox-light">Bitbox Light</a> (a fork of Bitbox SDK) and communicates with the Cloud API rest.bitcoin.com.

# Licence
**Copyright 2018-2019**
- Honest Cash (honest.cash)
- Alphateam Hackers GmbH (https://alphateamhackers.com)
- Adrian Barwicki (adrian@adrianbarwicki.com)
- Rosco Kalis (rosco.kalis@gmail.com)
- Josh Ellithorpe (quest@mac.com)

**MIT**

## Disclaimer
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
