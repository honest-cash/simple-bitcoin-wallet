describe("wallet", () => {
    it("loads SimpleWallet", () => {
      expect(SimpleWallet.decrypt).toBeDefined();
      expect(SimpleWallet.encrypt).toBeDefined();

      const simpleWallet = new SimpleWallet();

      expect(simpleWallet.cashAddress).toBeDefined();
      expect(simpleWallet.legacyAddress).toBeDefined();
      expect(simpleWallet.mnemonic).toBeDefined();
  });

    it("loads HDPath", () => {
        const simpleWallet1 = new SimpleWallet('grape host visa juice guess fitness clock accident sting output blast glove', {
            HdPath: "m/44'/0'/0'/1'"
        });

        expect(simpleWallet1.privateKey).toBe('KyorA5GcNwXPHuAP3FjAPTsz1uFZzgBWsN1epASxn7CMN79zBwYQ');
        expect(simpleWallet1.cashAddress).toBe('bitcoincash:qqtspryykk7rn3re6ngp6vtpkj6jkrqx4ch9glscuf');

        const simpleWallet2 = new SimpleWallet('grape host visa juice guess fitness clock accident sting output blast glove', {
            HdPath: "m/44'/0'/0'/2'"
        });

        expect(simpleWallet2.privateKey).toBe('L54FixKjc85ihTe2yLmbBezgrtxKoc7ypFP4FUM3qjJyxVK9iBHP');
        expect(simpleWallet2.cashAddress).toBe('bitcoincash:qqcqdj7uq5n609ergj3yzv95gdv8h0u34qlzdwjr8w');
    });
});


describe("bitbox", () => {
    it("loads bitbox", () => {
        expect(bitbox).toBeDefined();
    });
});

describe("Mnemonic encryption", () => {
  it("encrypts / decrypts mnemonic", () => {
      const simpleWallet = new SimpleWallet(null, {
        password: "myStrongPassword123"
      });

      let mnemonic = simpleWallet.mnemonic;
      
      const simpleWallet2 = new SimpleWallet(simpleWallet.mnemonicEncrypted, {
        password: "myStrongPassword123"
      });

      expect(simpleWallet2.mnemonic).toBe(mnemonic);

      let simpleWallet3;

      try {
        simpleWallet3 = new SimpleWallet(simpleWallet.mnemonicEncrypted, {
          password: "wrongpassword"
        });
      } catch (err) {
        simpleWallet3 = {}
      }

      expect(simpleWallet2.mnemonic).toBe(mnemonic);
      expect(simpleWallet3.mnemonic === mnemonic).toBe(false);
  });

  it("encrypts / decrypts mnemonic", () => {
    const simpleWallet = new SimpleWallet("U2FsdGVkX19NV28bxcoBIA6hS2eZDU5AV8uoRVNK6xnCoRsDFj0dq3ELcSelTE1t6pX+UiOEa0x1m4URFk1ZgQ61oglnNcC+Qh9Piw2ndpyJUE/F4aytvq3FE0mva2to", {
      password: "myStrongPassword123"
    });

    expect(simpleWallet.mnemonic).toBe("clean subway seven company online birth near casino boat picture manage kit");
});

  it("static encrypt() / decrypt() methods", () => {
    const mnemonic = "grape host visa juice guess fitness clock accident sting output blast glove";
    const password = "myStrongPassword123";

    const encrypted = SimpleWallet.encrypt(mnemonic, password);
    const decrypted = SimpleWallet.decrypt(encrypted, password);

    expect(typeof encrypted).toBe("string");
    expect(decrypted).toBe(mnemonic);
  });
});
