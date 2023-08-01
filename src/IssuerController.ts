import { Issuer } from "./Issuer";
import {
  readJsonFile,
  writeJsonFile,
  UniversityCredentialsContainer,
} from "./Utils";
const path = require("path");

export class IssuerController {
  private issuer: Issuer;

  public async init() {
    this.issuer = await Issuer.build();
    const jsonFile = readJsonFile(path.resolve(__dirname, "dids.json"));
    this.issuer.importDid(jsonFile.cheqd.demo.did);
  }

  public async invitationLink() {
    return await this.issuer.printConnectionInvite();
  }

  public async waitForConnection() {
    await this.issuer.waitForConnection();
  }

  public async issueCredential(credential: UniversityCredentialsContainer) {
    await this.issuer.issueCredential(credential);
  }

  public async sendProofRequest() {
    await this.issuer.sendProofRequest();
  }

  public async createDid() {
    console.log("Creating did...");
    const did = await this.issuer.createDid();
    const jsonFile = readJsonFile(path.resolve(__dirname, "dids.json"));
    jsonFile.cheqd["release"] = {
      did: did.didState.did,
    };
    writeJsonFile(path.resolve(__dirname, "dids.json"), jsonFile);

    console.log("did: " + did.didState.did);
  }

  public async importSchema() {}
}
