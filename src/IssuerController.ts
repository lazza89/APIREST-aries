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
    this.issuer.importDid(jsonFile.cheqd.release.did);
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

  public async createSchema(schema: any) {
    console.log(schema);
    const jsonFile = readJsonFile(path.resolve(__dirname, "schema.json"));

    const ret2 = await this.issuer.agent.modules.anoncreds.getCreatedSchemas({
      schemaName: "UNIPD",
    });

    console.log(ret2);

    /*
    const ret = await this.issuer.agent.modules.anoncreds.getSchema(
      "did:cheqd:testnet:b6843bcc-2a34-431a-bb61-958c03c91ba1/resources/a5dac974-90c6-4cb0-8b0c-d3f83effb0d0"
    );

    console.log(ret);

    /*
    const schemaState = await this.issuer.registerCustomSchema(schema);
    console.log("Schema created: " + schemaState.schemaId);

    jsonFile.schemas[`${schema.name}-${schema.version}`] = {
      schema,
      schemaId: schemaState.schemaId,
    };
    writeJsonFile(path.resolve(__dirname, "schema.json"), jsonFile);
    */
  }
}
