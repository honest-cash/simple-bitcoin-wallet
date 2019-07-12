const BITBOXSDK = require('bitbox-sdk').BITBOX;
const BITBOX = new BITBOXSDK({ restURL: "https://rest.bitcoin.com/v2/" });

import { sortUtxosBySize, SortingOrder, toBuffer } from "./utils";
import { ITransactionReceiver, IWalletInfo, IOpReturnOutput, ITxOutput, isTransactionReceiver, isOpReturnOutput, ISeparatedOutputs, IUtxo, IHexTransaction } from "./interfaces";


function changeAddrFromMnemonic(mnemonic: string, HdPath: string) {
    const rootSeed = BITBOX.Mnemonic.toSeed(mnemonic);
    const masterHDNode = BITBOX.HDNode.fromSeed(rootSeed/*, "bchtest"*/);
    const change = BITBOX.HDNode.derivePath(masterHDNode, HdPath);

    return change;
}

const createOpReturnScript = (
    opReturnOutput: IOpReturnOutput
) => {
    let script = [
        BITBOX.Script.opcodes.OP_RETURN,
        ...opReturnOutput.opReturn.map((output: string) => toBuffer(output))
    ];

    return BITBOX.Script.encode(script);
};

const calculateFee = (
    utxoCount: number,
    separatedOutputs: ISeparatedOutputs,
    satsPerByte: number = 1.0
): number => {
    const { receivers, opReturnScripts } = separatedOutputs;

    const byteCount = BITBOX.BitcoinCash.getByteCount(
        { P2PKH: utxoCount },
        { P2PKH: 1 + receivers.length, P2SH: opReturnScripts.length }
    );

    const opReturnByteCount = opReturnScripts.reduce((acc, script) => acc + script.byteLength, 0);

    return Math.ceil((byteCount + opReturnByteCount) * satsPerByte);
};

const separateOutputs = (
    outputs: ITxOutput[]
): ISeparatedOutputs => {
    const receivers = outputs
        .filter((output) => isTransactionReceiver(output)) as ITransactionReceiver[];
    const opReturnScripts = outputs
        .filter((output) => isOpReturnOutput(output))
        .map((output) => createOpReturnScript(output as IOpReturnOutput));

    return { receivers, opReturnScripts };
};

const getNecessaryUtxosAndChange = (
    outputs: ISeparatedOutputs,
    availableUtxos: IUtxo[]
): { necessaryUtxos: IUtxo[], change: number } => {
    const sortedUtxos = sortUtxosBySize(availableUtxos, SortingOrder.ASCENDING);

    let fee = calculateFee(0, outputs);
    let satoshisToSend = outputs.receivers.reduce((acc, receiver) => acc + receiver.amountSat, 0);
    let satoshisNeeded = satoshisToSend + fee;

    let satoshisAvailable = 0;
    let necessaryUtxos: IUtxo[] = [];

    for (let utxo of sortedUtxos) {
        necessaryUtxos.push(utxo)
        satoshisAvailable += utxo.satoshis;

        // Additional cost per Utxo input is 148 sats
        satoshisNeeded += 148;

        if (satoshisAvailable >= satoshisNeeded) {
            break;
        }
    }

    let change = satoshisAvailable - satoshisNeeded;

    if (change < 0) {
        console.log(`Available satoshis (${satoshisAvailable}) below needed satoshis (${satoshisNeeded}).`);
        throw new Error("Insufficient balance");
    }

    return { necessaryUtxos, change };
};

export const createTransaction = async (
    outputs: ITxOutput[],
    walletInfo: IWalletInfo
): Promise<IHexTransaction> => {
    const separatedOutputs = separateOutputs(outputs);
    const utxos = (await BITBOX.Address.utxo(walletInfo.cashAddress)).utxos;
    const { necessaryUtxos, change } = getNecessaryUtxosAndChange(separatedOutputs, utxos);

    const transactionBuilder = new BITBOX.TransactionBuilder(/* "bchtest" */);

    // Add inputs
    necessaryUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.txid, utxo.vout);
    });

    // Add outputs
    separatedOutputs.receivers.forEach(receiver => {
        transactionBuilder.addOutput(receiver.address, receiver.amountSat);
    });

    separatedOutputs.opReturnScripts.forEach(script => {
        transactionBuilder.addOutput(script, 0);
    });

    if (change && change > 546) {
        transactionBuilder.addOutput(walletInfo.cashAddress, change);
    }

    // Sign inputs
    const changeAddr = changeAddrFromMnemonic(walletInfo.mnemonic, walletInfo.HdPath);
    const keyPair = BITBOX.HDNode.toKeyPair(changeAddr);

    necessaryUtxos.forEach((utxo, i) => {
        let redeemScript;

        transactionBuilder.sign(
            i,
            keyPair,
            redeemScript,
            transactionBuilder.hashTypes.SIGHASH_ALL,
            utxo.satoshis
        );
    });

    const tx = transactionBuilder.build();
    return { hex: tx.toHex(), txid: tx.getId() };
};

export const sendBch = async (
    outputs: ITxOutput[],
    walletInfo: IWalletInfo
): Promise<IHexTransaction> => {
    const transaction = await createTransaction(outputs, walletInfo);

    try {
        const sent = await BITBOX.RawTransactions.sendRawTransaction(transaction.hex);
        console.log(sent);
    } catch (err) {
        console.log(err);
    }

    return transaction;
};
