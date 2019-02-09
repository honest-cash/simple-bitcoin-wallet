const BITBOXSDK = require('bitbox-light/lib/bitbox-sdk');
const BITBOX = new BITBOXSDK.default({ restURL: "https://rest.bitcoin.com/v1/" });

import { getWalletInfo } from "./getWalletInfo";
import { sortUtxosBySize, SortingOrder } from "./utils";
import { ITransactionReceiver, IWalletInfo, IOpReturnOutput, ITxOutput, isTransactionReceiver, isOpReturnOutput } from "./interfaces";
import { Buffer } from 'buffer';

// Generate a change address from a Mnemonic of a private key.
function changeAddrFromMnemonic(mnemonic: string, HdPath: string) {
    // root seed buffer
    const rootSeed = BITBOX.Mnemonic.toSeed(mnemonic)

    // master HDNode
    const masterHDNode = BITBOX.HDNode.fromSeed(rootSeed/** , "testnet"*/)

    // HDNode of BIP44 account
    const change = BITBOX.HDNode.derivePath(masterHDNode, HdPath)

    return change;
}

// Get the balance in BCH of a BCH address.
async function getBCHBalance(addr: string, verbose: boolean = false) {
    try {
        const result = await getWalletInfo(addr, verbose);

        if (verbose) console.log(result)

        return result.balance
    } catch (err) {
        console.error("Error in getBCHBalance: ", err)
        console.log(`addr: ${addr}`)
        throw err
    }
};

const toBuffer = (output: string): Buffer => {
    const data = output.replace(/^0x/, '');
    const format = data === output ? 'utf8' : 'hex';

    return Buffer.from(data, format);
}

const createOpReturnScript = (
    opReturnOutput: IOpReturnOutput
) => {
    let script = [
        BITBOX.Script.opcodes.OP_RETURN,
        ...opReturnOutput.opReturn.map((output: IOpReturnOutput) => toBuffer(output))
    ];

    return BITBOX.Script.encode(script);
}

const calculateFee = (
    utxoCount: number,
    receivers: ITransactionReceiver[],
    opReturnScripts: any[],
    satsPerByte: number = 1.0
): number => {
    const byteCount = BITBOX.BitcoinCash.getByteCount(
        { P2PKH: utxoCount },
        { P2PKH: 1 + receivers.length, P2SH: opReturnScripts.length }
    );

    const opReturnByteCount = opReturnScripts.reduce((acc, script) => acc + script.byteLength, 0);

    return Math.floor((byteCount + opReturnByteCount) * satsPerByte);
}

export const createTransaction = async (
    outputs: ITxOutput[],
    walletInfo: IWalletInfo
) => {
    const receivers = outputs.filter((output) => isTransactionReceiver(output)) as ITransactionReceiver[];
    const opReturnScripts = outputs
            .filter((output) => isOpReturnOutput(output))
            .map((output) => createOpReturnScript(output as IOpReturnOutput));
    const feeEstimate = calculateFee(1, receivers, opReturnScripts);

    // Get the balance of the sending address.
    const balance = await getBCHBalance(walletInfo.cashAddress, false);
    console.log(`Balance of sending address ${walletInfo.cashAddress} is ${balance} BCH.`)

    // Exit if the balance is below fee estimate.
    if (balance <= BITBOX.BitcoinCash.toBitcoinCash(feeEstimate)) {
        console.log(`Balance of sending address (${balance}) is below fee estimate (${BITBOX.BitcoinCash.toBitcoinCash(feeEstimate)}).`);
        throw new Error("Insufficient balance");
    }

    const transactionBuilder = new BITBOX.TransactionBuilder(/* "testnet" */);

    // Select the utxos needed for this transaction
    const utxos = await BITBOX.Address.utxo(walletInfo.cashAddress);
    const sortedUtxos = sortUtxoFromLowestToBiggest(utxos);

    const satoshisToSend = receivers.reduce((acc, receiver) => acc + receiver.amountSat, 0);
    const satoshisNeeded = satoshisToSend + feeEstimate;

    let satoshisAvailable = 0;
    let utxoIndex = 0;

    while (satoshisAvailable < satoshisNeeded && utxoIndex < sortedUtxos.length) {
        console.log(sortedUtxos[utxoIndex]);

        transactionBuilder.addInput(sortedUtxos[utxoIndex].txid, sortedUtxos[utxoIndex].vout);
        satoshisAvailable += sortedUtxos[utxoIndex].satoshis;
        utxoIndex++;
    }

    if (satoshisNeeded > satoshisAvailable) {
        console.log(`Available satoshis (${satoshisAvailable}) below needed satoshis (${satoshisNeeded}).`);
        throw new Error("Insufficient balance");
    }

    let txFee = calculateFee(utxoIndex, receivers, opReturnScripts);
    let remainder = satoshisAvailable - satoshisToSend - txFee;

    if (remainder < 0) {
        // Add one additional utxo if it's available
        if (utxoIndex < sortedUtxos.length) {
            transactionBuilder.addInput(sortedUtxos[utxoIndex].txid, sortedUtxos[utxoIndex].vout);
            satoshisAvailable += sortedUtxos[utxoIndex].satoshis;
            utxoIndex++;

            txFee = calculateFee(utxoIndex, receivers, opReturnScripts);
            remainder = satoshisAvailable - satoshisToSend - txFee;
        } else {
            throw new Error("Insufficient balance (not enough to pay transaction fees)");
        }
    }

    console.log("Change is " + remainder);

    for (let receiver of receivers) {
        transactionBuilder.addOutput(receiver.address, receiver.amountSat);
    }

    for (let script of opReturnScripts) {
        transactionBuilder.addOutput(script, 0);
    }

    if (remainder && remainder > 546) {
        transactionBuilder.addOutput(walletInfo.cashAddress, remainder);
    }

    // Generate a change address from a Mnemonic of a private key.
    const change = changeAddrFromMnemonic(walletInfo.mnemonic, walletInfo.HdPath)
    // Generate a keypair from the change address.
    const keyPair = BITBOX.HDNode.toKeyPair(change)

    for (let index = 0; index < utxoIndex; index++) {
        // Sign the transaction with the HD node.
        let redeemScript;

        transactionBuilder.sign(
            index,
            keyPair,
            redeemScript,
            transactionBuilder.hashTypes.SIGHASH_ALL,
            sortedUtxos[index].satoshis
        );
    }

    const tx = transactionBuilder.build();

    return { hex: tx.toHex(), txid: tx.getId() };
}

export const sendBch = async (outputs: ITxOutput[], walletInfo: IWalletInfo) => {
    const transaction = await createTransaction(outputs, walletInfo);

    try {
        const sent = await BITBOX.RawTransactions.sendRawTransaction(transaction.hex);
        console.log(sent);
    } catch (err) {
        console.log(err);
    }

    return transaction;
};
