import { upload, download } from "./upload";
import { IAdvancedOptions, IUploadResponse } from "./interfaces";
import SimpleWallet from "./SimpleBitcoinWallet";
interface IMetaData {
  title?: string;
  extUri?: string;
  ext?: string;
}
export default class SimpleBitcoinDatabase extends SimpleWallet {
    constructor(hdPrivateKeyOrMnemonic: string, advancedOptions?: IAdvancedOptions) {
      super(hdPrivateKeyOrMnemonic, advancedOptions);
    }

    public async upload(data: any, metaData: IMetaData): Promise<IUploadResponse> {
      metaData = metaData || {};

      return await upload({
        data,
        title: metaData.title,
        extUri: metaData.extUri,
        ext: metaData.ext
      }, {
        cashAddress: this.cashAddress,
        privateKey: this.privateKey
      });
    }

    public async download(bitcoinFileUri: string) {
      return download(bitcoinFileUri);
    }
}
