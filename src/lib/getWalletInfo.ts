const BITBOXSDK = require('bitbox-sdk').BITBOX;
const BITBOX = new BITBOXSDK({ restURL: "https://rest.bitcoin.com/v2/" });

export const getWalletInfo = async (addr: string, verbose: boolean) => {
    try {
        const result = await BITBOX.Address.details([addr])

        if (verbose) console.log(result)

        const bchWalletInfo = result[0]

        return bchWalletInfo;
    } catch (err) {
        console.log(`addr: ${addr}`);
        console.error("Error in getWalletInfo: ", err);

        throw err
    }
};
