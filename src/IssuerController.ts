import { redText } from "./OutputClass";
import { Issuer } from "./Issuer";
import {
  readJsonFile,
  writeJsonFile,
  UniversityCredentialsContainer,
} from "./Utils";
import { json } from "body-parser";
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

  public async issueCredential(credential: any) {
    const schemaLedger =
      await this.issuer.agent.modules.anoncreds.getCreatedSchemas({
        schemaName: `${credential.schema}`,
        schemaVersion: `${credential.schemaVersion}`,
      });

    if (schemaLedger.length == 0) {
      console.log(redText("Schema not found"));
      return "Schema not found";
    }

    await this.issuer.customIssueCredential(
      credential,
      schemaLedger[0].schemaId
    );
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

    const schemaLedger =
      await this.issuer.agent.modules.anoncreds.getCreatedSchemas({
        schemaName: `${schema.name}`,
        schemaVersion: `${schema.version}`,
      });

    if (schemaLedger.length == 1) {
      console.log("Schema already created, founded in ledger \n");
      console.log(schemaLedger[0]);
      await this.writeOnSchemaJSON(
        schemaLedger[0].schema,
        schemaLedger[0].schemaId
      );
      return "Schema already created, founded in ledger, saving in schema.json";
    }

    if (schemaLedger.length > 1) {
      console.log(
        "Schema already created, founded in ledger, but more than one? \n"
      );

      return "Schema already created, founded in ledger, but more than one?, i don't like it!";
    }

    const schemaState = await this.issuer.registerCustomSchema(schema);
    await this.writeOnSchemaJSON(schemaState.schema, schemaState.schemaId);

    return "Schema created: " + schemaState.schemaId;
  }

  private async writeOnSchemaJSON(schema: any, schemaId: string) {
    const jsonFile = readJsonFile(path.resolve(__dirname, "schema.json"));
    jsonFile.anoncreds[schema.name + "-" + schema.version] = {
      schemaState: schema,
      schemaId: schemaId,
    };
    writeJsonFile(path.resolve(__dirname, "schema.json"), jsonFile);
  }
}
