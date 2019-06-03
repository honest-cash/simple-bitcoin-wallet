
import { findBiggestUtxo } from "./utils";
import { bfp as Bfp } from "./bitcoinfiles/index";

const BITBOXSDK = require('bitbox-sdk');
const BITBOX = new BITBOXSDK.default();

const bfp = new Bfp(BITBOXSDK.default);

interface IObj {
    data: any,
    extUri: string;
    ext: string;
    title: string;
}
interface IWalletInfo {
    cashAddress: string;
    privateKey: string;
}

async function getUtxo(address: string, log=true) {
    // must be a cash or legacy addr
    if(!BITBOX.Address.isCashAddress(address) && !BITBOX.Address.isLegacyAddress(address))
        throw new Error("Not an a valid address format, must be cashAddr or Legacy address format.");
    let res = await BITBOX.Address.utxo(address);
    if(log)
        console.log('getUtxo for ', address, ': ', res);
    return findBiggestUtxo(res);
}

export const upload = async (obj: IObj, walletInfo: IWalletInfo) => {
    const processedData = typeof obj.data === "string" ? obj.data : JSON.stringify(obj.data);

    const someFileBuffer = Buffer.from(processedData);
    const fileName = obj.title;
    const fileExt = obj.ext || "json";
    const fileUri = obj.extUri;
    const fileSize = someFileBuffer.length;
    const fileSha256Hex = BITBOX.Crypto.sha256(someFileBuffer).toString('hex');

    let config = {
        msgType: 1,
        chunkCount: 1,
        chunkData: null,  // chunk not needed for cost estimate stage
        fileName: fileName,
        fileExt: fileExt,
        fileSize: fileSize,
        fileSha256Hex: fileSha256Hex,
        prevFileSha256Hex: null
    };

    let uploadCost: number = Bfp.calculateFileUploadCost(fileSize, config);

    // 3 - create a funding transaction
    let fundingAddress = walletInfo.cashAddress;
    let fundingWif = walletInfo.privateKey;

    // 4 - Make sure address above is funded with the amount equal to the uploadCost
    let fundingUtxo = await getUtxo(fundingAddress);

    let fileId = await bfp.uploadFile(fundingUtxo, fundingAddress, fundingWif, someFileBuffer, fileName, fileExt, null, fileUri);

    return { fileId, uploadCost };
};

export const download = async (uri: string) => {
  let result = await bfp.downloadFile(uri);
  let fileBuffer = result.fileBuf;
  const data = fileBuffer.toString();

  return { data };
};
