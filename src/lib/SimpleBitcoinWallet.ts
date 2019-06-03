
import { sendBch } from "./distributeFunds";
import { getWalletInfo } from "./getWalletInfo";
import { IAdvancedOptions, ITxOutput } from "./interfaces";

const BITBOXSDK = require('bitbox-sdk');
const BITBOX = new BITBOXSDK.default();

declare var CryptoJS: any;

export default class SimpleWallet {
  constructor(hdPrivateKeyOrMnemonic: string, public advancedOptions?: IAdvancedOptions) {
    this.advancedOptions = (advancedOptions || {}) as IAdvancedOptions;

    this.HdPath = this.advancedOptions.HdPath || `m/44'/0'/0'/0/0`;

    this.create(hdPrivateKeyOrMnemonic);
  }

  public mnemonic: string;
  public mnemonicEncrypted: string;
  public cashAddress: string;
  public address: string;
  public legacyAddress: string;
  public privateKey: string;
  public HdPath: string;

  public async getBalance(bchAddress?: string): Promise<number> {
    const walletInfo = await getWalletInfo(bchAddress || this.cashAddress, false);

    return walletInfo.balance + walletInfo.unconfirmedBalance;
  }

  public async getWalletInfo(bchAddress?: string) {
    const walletInfo = await getWalletInfo(bchAddress || this.cashAddress, false);

    return walletInfo;
  }

  public async send(outputs: ITxOutput[]) {
      return sendBch(outputs, {
        mnemonic: this.mnemonic,
        cashAddress: this.address,
        HdPath: this.HdPath
      });
  }

  public static encrypt(mnemonic: string, password: string): string {
    return CryptoJS.AES.encrypt(
      mnemonic,
      password
    ).toString();
  }

  public static decrypt(mnemonicEncrypted: string, password: string): string {
    let mnemonic: string;

    try {
      mnemonic = CryptoJS.AES.decrypt(
        mnemonicEncrypted,
        password
      ).toString(CryptoJS.enc.Utf8);
    } catch (err) {
      throw new Error("Wrong password");
    }

    return mnemonic;
  }

  private create(mnemonic: string) {
      if (mnemonic && this.advancedOptions.password) {
        mnemonic = SimpleWallet.decrypt(mnemonic, this.advancedOptions.password);
      }

      mnemonic = mnemonic || BITBOX.Mnemonic.generate(128);
      let rootSeedBuffer = BITBOX.Mnemonic.toSeed(mnemonic);
      let masterHDNode = BITBOX.HDNode.fromSeed(rootSeedBuffer);
      let childNode = masterHDNode.derivePath(this.HdPath);
      let privateKey = BITBOX.HDNode.toWIF(childNode);

      if (this.advancedOptions.password) {
        this.mnemonicEncrypted = SimpleWallet.encrypt(mnemonic, this.advancedOptions.password);
      }

      this.mnemonic = mnemonic;
      this.privateKey = privateKey;
      this.address = this.cashAddress = BITBOX.HDNode.toCashAddress(childNode);
      this.legacyAddress = BITBOX.HDNode.toLegacyAddress(childNode);
  }
}
