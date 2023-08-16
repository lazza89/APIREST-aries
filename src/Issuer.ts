import type { RegisterCredentialDefinitionReturnStateFinished } from "@aries-framework/anoncreds";
import type {
  ConnectionRecord,
  ConnectionStateChangedEvent,
  CredentialPreviewAttributeOptions,
} from "@aries-framework/core";
import type {
  IndyVdrRegisterSchemaOptions,
  IndyVdrRegisterCredentialDefinitionOptions,
} from "@aries-framework/indy-vdr";

import {
  ConnectionEventTypes,
  KeyType,
  TypedArrayEncoder,
} from "@aries-framework/core";

import { BaseAgent } from "./BaseAgent";
import { Color, Output, greenText, purpleText, redText } from "./OutputClass";
import { SchemaAndCredDefInLedger, IssuerConnectionStatus, IssuerCredentialStatus, IssuerProofStatus } from "./Utils";
import { textChangeRangeIsUnchanged } from "typescript";

export enum RegistryOptions {
  cheqd = "did:cheqd",
}

export class Issuer extends BaseAgent {
  public outOfBandId?: string;
  public anonCredsIssuerId?: string;
  public issuerConnectionStatus: IssuerConnectionStatus = IssuerConnectionStatus.NOT_CONNECTED;
  public issuerCredentialStatus: IssuerCredentialStatus = IssuerCredentialStatus.NONE;
  public issuerProofStatus: IssuerProofStatus = IssuerProofStatus.NONE;

  public constructor(port: number, name: string) {
    super({ port, name, useLegacyIndySdk: true });
  }

  public static async build(): Promise<Issuer> {
    const faber = new Issuer(8080, "faber");
    await faber.initializeAgent();
    return faber;
  }

  public async importDid(cheqdDid: string) {
    // NOTE: we assume the did is already registered on the ledger, we just store the private key in the wallet
    // and store the existing did in the wallet
    const did = cheqdDid;
    await this.agent.dids.import({
      did,
      overwrite: true,
      privateKeys: [
        {
          keyType: KeyType.Ed25519,
          privateKey: TypedArrayEncoder.fromString(
            "afjdemoverysercure00000000000000"
          ),
        },
      ],
    });
    this.anonCredsIssuerId = did;
  }

  public async createDid() {
    // create a key pair
    const did = await this.agent.dids.create({
      method: "cheqd",
      // the secret contains a the verification method type and id
      secret: {
        verificationMethod: {
          id: "key-1",
          type: "Ed25519VerificationKey2020",
        },
      },
      // an optional methodSpecificIdAlgo parameter
      options: {
        network: "testnet",
        methodSpecificIdAlgo: "uuid",
      },
    });

    this.anonCredsIssuerId = did.didState.did;

    return did;
  }

  private async getConnectionRecord() {
    if (!this.outOfBandId) {
      throw Error(redText(Output.MissingConnectionRecord));
    }

    const [connection] = await this.agent.connections.findAllByOutOfBandId(
      this.outOfBandId
    );

    if (!connection) {
      throw Error(redText(Output.MissingConnectionRecord));
    }

    return connection;
  }

  public async printConnectionInvite() {
    this.issuerConnectionStatus = IssuerConnectionStatus.REQUESTED;

    const outOfBand = await this.agent.oob.createInvitation();
    this.outOfBandId = outOfBand.id;

    const invite = outOfBand.outOfBandInvitation.toUrl({
      domain: `https://nlazzarin.monokee.com`,
    });
    console.log(Output.ConnectionLink, invite, "\n");
    return invite;
  }


  timeoutConnection(reject: (reason?: any) => void): void {
    this.issuerConnectionStatus = IssuerConnectionStatus.NOT_CONNECTED;
    reject(new Error(redText(Output.MissingConnectionRecord)))
  }

  public async waitForConnection() {
    if (!this.outOfBandId) {
      throw new Error(redText(Output.MissingConnectionRecord));
    }

    console.log("Waiting for Alice to finish connection...");

    const getConnectionRecord = (outOfBandId: string) =>
      new Promise<ConnectionRecord>((resolve, reject) => {
        // Timeout of 20 seconds
        const timeoutId = setTimeout(
          () => this.timeoutConnection(reject),
          30000
        );

        // Start listener
        this.agent.events.on<ConnectionStateChangedEvent>(
          ConnectionEventTypes.ConnectionStateChanged,
          (e) => {
            if (e.payload.connectionRecord.outOfBandId !== outOfBandId) return;

            clearTimeout(timeoutId);
            resolve(e.payload.connectionRecord);
          }
        );

        // Also retrieve the connection record by invitation if the event has already fired
        void this.agent.connections
          .findAllByOutOfBandId(outOfBandId)
          .then(([connectionRecord]) => {
            if (connectionRecord) {
              clearTimeout(timeoutId);
              resolve(connectionRecord);
            }
          });
      });

    const connectionRecord = await getConnectionRecord(this.outOfBandId);

    try {
      await this.agent.connections.returnWhenIsConnected(connectionRecord.id);
    } catch (e) {
      console.log(
        redText(`\nTimeout of 20 seconds reached.. Returning to home screen.\n`)
      );
      return;
    }
    console.log(greenText(Output.ConnectionEstablished));
    this.issuerConnectionStatus = IssuerConnectionStatus.CONNECTED;
  }

  private printSchema(name: string, version: string, attributes: string[]) {
    console.log(`\n\nThe credential definition will look like this:\n`);
    console.log(purpleText(`Name: ${Color.Reset}${name}`));
    console.log(purpleText(`Version: ${Color.Reset}${version}`));
    console.log(purpleText("Attributes: "));
    for (const attrName of attributes) {
      console.log(attrName);
    }
  }

  public async registerCustomSchema(schema: any) {
    if (!this.anonCredsIssuerId) {
      throw new Error(redText("Missing anoncreds issuerId"));
    }

    const schemaTemplate = {
      name: schema.name,
      version: schema.version,
      attrNames: schema.attrNames,
      issuerId: this.anonCredsIssuerId,
    };

    this.printSchema(
      schemaTemplate.name,
      schemaTemplate.version,
      schemaTemplate.attrNames
    );

    console.log(greenText("\nRegistering schema...\n", false));

    const { schemaState } =
      await this.agent.modules.anoncreds.registerSchema<IndyVdrRegisterSchemaOptions>(
        {
          schema: schemaTemplate,
          options: {
            endorserMode: "internal",
            endorserDid: this.anonCredsIssuerId,
          },
        }
      );

    if (schemaState.state !== "finished") {
      throw new Error(
        `Error registering schema: ${
          schemaState.state === "failed" ? schemaState.reason : "Not Finished"
        }`
      );
    }
    console.log("\nSchema registered!\n");
    return schemaState;
  }

  public async registerCredentialDefinition(schemaId: string) {
    if (!this.anonCredsIssuerId) {
      throw new Error(redText("Missing anoncreds issuerId"));
    }

    console.log("\nRegistering credential definition...\n");
    const { credentialDefinitionState } =
      await this.agent.modules.anoncreds.registerCredentialDefinition<IndyVdrRegisterCredentialDefinitionOptions>(
        {
          credentialDefinition: {
            schemaId,
            issuerId: this.anonCredsIssuerId,
            tag: "latest",
          },
          options: {
            endorserMode: "internal",
            endorserDid: this.anonCredsIssuerId,
          },
        }
      );

    if (credentialDefinitionState.state !== "finished") {
      throw new Error(
        `Error registering credential definition: ${
          credentialDefinitionState.state === "failed"
            ? credentialDefinitionState.reason
            : "Not Finished"
        }}`
      );
    }

    console.log(credentialDefinitionState);

    console.log("\nCredential definition registered!!\n");
    return credentialDefinitionState;
  }

  public async getConnectionId() {
    const connectionRecord = await this.getConnectionRecord();
    return connectionRecord.id;
  }

  private async getCredentialDefinition(schemaId: string) {
    //return credentialDefinition.credentialDefinitionId;
  }

  public async checkSchemaAndCredDefInLedger(
    schema: any
  ): Promise<[string, string, SchemaAndCredDefInLedger]> {
    let schemaIdTmp = "";
    let credDefIdTmp = "";

    const schemaLedger = await this.agent.modules.anoncreds.getCreatedSchemas({
      schemaName: `${schema.name}`,
      schemaVersion: `${schema.version}`,
    });
    if (schemaLedger.length != 0) {
      console.log("Schema already created, founded in ledger \n");
      console.log("cheching credential definition...");

      schemaIdTmp = schemaLedger[0].schemaId;
      const credDefinition =
        await this.agent.modules.anoncreds.getCreatedCredentialDefinitions({
          schemaId: schemaIdTmp,
        });

      if (credDefinition.length != 0) {
        credDefIdTmp = credDefinition[0].credentialDefinitionId;
        console.log(
          "Credential definition already created, founded in ledger \n"
        );
        console.log("Schema id: ", schemaIdTmp, "\n");
        console.log("Credential definition id: ", credDefIdTmp, "\n");

        return [
          schemaIdTmp,
          credDefIdTmp,
          SchemaAndCredDefInLedger.SCHEMA_AND_CRED_DEF,
        ];
      }
      return [schemaIdTmp, credDefIdTmp, SchemaAndCredDefInLedger.SCHEMA];
    }

    return [schemaIdTmp, credDefIdTmp, SchemaAndCredDefInLedger.NONE];
  }

  public async customIssueCredential(
    credential: any,
    connectionId: string,
    credentialDefinitionId: string
  ) {
    const attributes: CredentialPreviewAttributeOptions[] = [];

    for (const attributeName in credential.attributes) {
      if (
        Object.prototype.hasOwnProperty.call(
          credential.attributes,
          attributeName
        )
      ) {
        const attributeValue = credential.attributes[attributeName];
        console.log(`${attributeName}: ${attributeValue}`);
        attributes.push({ name: attributeName, value: attributeValue });
      }
    }

    const cred = await this.agent.credentials.offerCredential({
      connectionId: connectionId,
      protocolVersion: "v2",
      credentialFormats: {
        anoncreds: {
          attributes: attributes,
          credentialDefinitionId: credentialDefinitionId,
        },
      },
    });
    console.log(
      `\nCredential offer sent!\n\nGo to the holder agent to accept the credential offer\n\n${Color.Reset}`
    );
    console.log("credential: ", cred);
    return "Credential sent to holder!";
  }

  private async printProofFlow(print: string) {
    console.log(print);
    await new Promise((f) => setTimeout(f, 2000));
  }

  public async sendProofRequest(proofAttribute: any) {
    const connectionRecord = await this.getConnectionRecord();
    await this.printProofFlow(greenText("\nRequesting proof...\n", false));

    const ret = await this.agent.proofs.requestProof({
      protocolVersion: "v2",
      connectionId: connectionRecord.id,
      proofFormats: {
        anoncreds: {
          name: "proof-request",
          version: "1.0",
          requested_attributes: proofAttribute,
        },
      },
    });
    console.log(
      `\nProof request sent!\n\nGo to the Alice agent to accept the proof request\n\n${Color.Reset}`
    );
    return "Proof request sent to holder!";
  }

  public revokeCredential(credentialId: string) {
    //this.agent.credentials.
  }

  public async sendMessage(message: string) {
    const connectionRecord = await this.getConnectionRecord();
    await this.agent.basicMessages.sendMessage(connectionRecord.id, message);
  }

  public async exit() {
    console.log(Output.Exit);
    await this.agent.shutdown();
    process.exit(0);
  }

  public async restart() {
    await this.agent.shutdown();
  }
}
