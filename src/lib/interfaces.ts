import { ITxOutput } from './interfaces';
export interface ITransactionReceiver extends ITxOutput {
  address: string;
  amountSat: number;
}

export const isTransactionReceiver = (o: ITxOutput): boolean => {
  return 'address' in o;
}

export interface IOpReturnOutput extends ITxOutput {
  opReturn: string[];
}

export const isOpReturnOutput = (o: ITxOutput): boolean => {
  return 'opReturn' in o;
}

export interface ITxOutput {};

export interface IAdvancedOptions {
  password?: string;
  HdPath?: string;
  accountIndex?: string;
}

export interface IUploadResponse {
  fileId: string;
  uploadCost: number;
}
export interface IWalletInfo {
  mnemonic: string;
  cashAddress: string,
  HdPath: string
}
