import { IUtxo } from './interfaces';
// Returns the utxo with the biggest balance from an array of utxos.

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

export const findBiggestUtxo = (
    utxos: IUtxo[]
): IUtxo => {
    let largestAmount = 0
    let largestIndex = 0

    for (var i = 0; i < utxos.length; i++) {
        const thisUtxo = utxos[i]

        if (thisUtxo.satoshis > largestAmount) {
            largestAmount = thisUtxo.satoshis
            largestIndex = i
        }
    }

    return utxos[largestIndex]
};
