import { IUtxo } from './interfaces';
import { Buffer } from 'buffer';

export enum SortingOrder {
    ASCENDING,
    DESCENDING
}

// Sort utxos by their size in satoshis. Can specify a sorting order (defaults to ascending).
export const sortUtxosBySize = (
    utxos: IUtxo[],
    sortingOrder: SortingOrder = SortingOrder.ASCENDING
): IUtxo[] => {
    if (sortingOrder === SortingOrder.ASCENDING) {
        return utxos.sort((a, b) => a.satoshis - b.satoshis);
    } else {
        return utxos.sort((a, b) => b.satoshis - a.satoshis);
    }
}

// Returns the utxo with the biggest balance from an array of utxos.
export const findBiggestUtxo = (
    utxos: IUtxo[]
): IUtxo => {
    if (utxos.length === 0) return null;
    return sortUtxosBySize(utxos, SortingOrder.DESCENDING)[0];
};

export const toBuffer = (
    output: string
): Buffer => {
    const data = output.replace(/^0x/, '');
    const format = data === output ? 'utf8' : 'hex';
    return Buffer.from(data, format);
}
