import { redText } from "./OutputClass";
import { Issuer } from "./Issuer";
import {
  readJsonFile,
  writeJsonFile,
  UniversityCredentialsContainer,
} from "./Utils";
import { json } from "body-parser";
const path = require("path");

enum SchemaAndCredDefInLedger {
  NONE, //schema and credential definition not present
  SCHEMA, //schema present, credential definition not present
  SCHEMA_AND_CRED_DEF, //schema and credential definition present
}

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

    const connectionId = await this.issuer.getConnectionId();

    /*
    await this.issuer.customIssueCredential(
      credential,
      schemaLedger[0].schemaId
    );
    */
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

  //creating schema and credential definition, all saving in json files
  public async createSchema(schema: any) {
    console.log(schema);

    //check if schema and credential definition are already in ledger and return SchemaAndCredDefInLedger enum
    const isPresent = await this.checkSchemaAndCredDefInLedger(schema);

    switch (isPresent) {
      case SchemaAndCredDefInLedger.NONE:
        console.log(
          "Schema not found... creating schema and credential definition"
        );

        const schemaState = await this.issuer.registerCustomSchema(schema);
        console.log("Schema created, Id: " + schemaState.schemaId);

        console.log("Creating credential definition...");

        const credDefinition = await this.issuer.registerCredentialDefinition(
          schemaState.schemaId
        );
        console.log(
          "Credential definition registered, Id: " +
            credDefinition.credentialDefinitionId
        );

        await this.writeOnJSON(schemaState, credDefinition);

        return "schema and credential definition created";

      case SchemaAndCredDefInLedger.SCHEMA_AND_CRED_DEF:
        console.log("Schema and credential definition already created");
        return "schema and credential definition already created";

      case SchemaAndCredDefInLedger.SCHEMA:
        console.log("Schema already created, creating credential definition");
        const schemaLedger =
          await this.issuer.agent.modules.anoncreds.getCreatedSchemas({
            schemaName: `${schema.name}`,
            schemaVersion: `${schema.version}`,
          });
        const credDef = await this.issuer.registerCredentialDefinition(
          schemaLedger[0].schemaId
        );

        console.log(schemaLedger[0]);
        console.log(credDef);

        await this.writeOnJSON(schemaLedger[0], credDef);
        return "schema and credential definition created";

      default:
        return "error creating schema and credential definition";
    }
  }

  private async checkSchemaAndCredDefInLedger(
    schema: any
  ): Promise<SchemaAndCredDefInLedger> {
    const schemaLedger =
      await this.issuer.agent.modules.anoncreds.getCreatedSchemas({
        schemaName: `${schema.name}`,
        schemaVersion: `${schema.version}`,
      });
    if (schemaLedger.length != 0) {
      console.log("Schema already created, founded in ledger \n");
      console.log("cheching credential definition...");
      const credDefinition =
        await this.issuer.agent.modules.anoncreds.getCreatedCredentialDefinitions(
          { schemaId: schemaLedger[0].schemaId }
        );
      if (credDefinition.length != 0) {
        console.log(
          "Credential definition already created, founded in ledger \n"
        );
        console.log("Schema id: ", schemaLedger[0].schemaId, "\n");
        console.log(
          "Credential definition id: ",
          credDefinition[0].credentialDefinitionId,
          "\n"
        );

        return SchemaAndCredDefInLedger.SCHEMA_AND_CRED_DEF;
      }
      return SchemaAndCredDefInLedger.SCHEMA;
    }

    return SchemaAndCredDefInLedger.NONE;
  }

  private async writeOnJSON(schema: any, credentialDefId: any) {
    const jsonFile = readJsonFile(path.resolve(__dirname, "schema.json"));
    jsonFile.anoncreds[schema.schema.name + "-" + schema.schema.version] = {
      schemaState: schema.schema,
      schemaId: schema.schemaId,
      credentialDefinitionId: credentialDefId.credentialDefinitionId,
    };
    writeJsonFile(path.resolve(__dirname, "schema.json"), jsonFile);
  }
}
