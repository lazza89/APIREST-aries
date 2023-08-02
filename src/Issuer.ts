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
  DidDocument,
  KeyType,
  TypedArrayEncoder,
  utils,
} from "@aries-framework/core";

import { BaseAgent } from "./BaseAgent";
import { Color, Output, greenText, purpleText, redText } from "./OutputClass";
import { UniversityCredentialsContainer } from "./Utils";
import { CheqdDidCreateOptions } from "@aries-framework/cheqd";

export enum RegistryOptions {
  cheqd = "did:cheqd",
}

interface Attribute {
  name: string;
  value: any;
}

export class Issuer extends BaseAgent {
  public outOfBandId?: string;
  public credentialDefinition?: RegisterCredentialDefinitionReturnStateFinished;
  public anonCredsIssuerId?: string;

  public constructor(port: number, name: string) {
    super({ port, name, useLegacyIndySdk: true });
  }

  public static async build(): Promise<Issuer> {
    const faber = new Issuer(9001, "faber");
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
    const outOfBand = await this.agent.oob.createInvitation();
    this.outOfBandId = outOfBand.id;

    const invite = outOfBand.outOfBandInvitation.toUrl({
      domain: `http://localhost:${this.port}`,
    });
    console.log(Output.ConnectionLink, invite, "\n");
    return invite;
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
          () => reject(new Error(redText(Output.MissingConnectionRecord))),
          20000000
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

  private async registerSchema() {
    if (!this.anonCredsIssuerId) {
      throw new Error(redText("Missing anoncreds issuerId"));
    }
    const schemaTemplate = {
      name: "College",
      version: "1.0.0",
      attrNames: ["name", "degree", "date"],
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

  private async registerCredentialDefinition(schemaId: string) {
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

    this.credentialDefinition = credentialDefinitionState;
    console.log("\nCredential definition registered!!\n");
    return this.credentialDefinition;
  }

  public async customIssueCredential(credential: any, schemaId: any) {
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

    const connectionRecord = await this.getConnectionRecord();
    const credentialDefinition = await this.registerCredentialDefinition(
      schemaId
    );

    const cred = await this.agent.credentials.offerCredential({
      connectionId: connectionRecord.id,
      protocolVersion: "v2",
      credentialFormats: {
        anoncreds: {
          attributes: attributes,
          credentialDefinitionId: credentialDefinition.credentialDefinitionId,
        },
      },
    });
    console.log(
      `\nCredential offer sent!\n\nGo to the holder agent to accept the credential offer\n\n${Color.Reset}`
    );
    console.log("credential: ", cred);
  }

  public async issueCredential(credential: any) {
    const schema = await this.registerSchema();
    const credentialDefinition = await this.registerCredentialDefinition(
      schema.schemaId
    );
    const connectionRecord = await this.getConnectionRecord();

    console.log(
      "credentialDefinition: ",
      credentialDefinition.credentialDefinitionId
    );

    const cred = await this.agent.credentials.offerCredential({
      connectionId: connectionRecord.id,
      protocolVersion: "v2",
      credentialFormats: {
        anoncreds: {
          attributes: [
            {
              name: "name",
              value: credential._name,
            },
            {
              name: "degree",
              value: credential._degree,
            },
            {
              name: "date",
              value: credential._date,
            },
          ],
          credentialDefinitionId: credentialDefinition.credentialDefinitionId,
        },
      },
    });
    console.log(
      `\nCredential offer sent!\n\nGo to the holder agent to accept the credential offer\n\n${Color.Reset}`
    );
    console.log("credential: ", cred);
  }

  private async printProofFlow(print: string) {
    console.log(print);
    await new Promise((f) => setTimeout(f, 2000));
  }

  private async newProofAttribute() {
    await this.printProofFlow(
      greenText(`Creating new proof attribute for 'name' ...\n`)
    );
    const proofAttribute = {
      name: {
        name: "name",
        restrictions: [
          {
            cred_def_id: this.credentialDefinition?.credentialDefinitionId,
          },
        ],
      },
    };

    return proofAttribute;
  }

  public async sendProofRequest() {
    const connectionRecord = await this.getConnectionRecord();
    const proofAttribute = await this.newProofAttribute();
    await this.printProofFlow(greenText("\nRequesting proof...\n", false));

    await this.agent.proofs.requestProof({
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
