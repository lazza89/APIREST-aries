import type { InitConfig } from "@aries-framework/core";

import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1CredentialProtocol,
  V1ProofProtocol,
} from "@aries-framework/anoncreds";
import { AnonCredsRsModule } from "@aries-framework/anoncreds-rs";
import { AskarModule } from "@aries-framework/askar";
import {
  CheqdAnonCredsRegistry,
  CheqdDidRegistrar,
  CheqdDidResolver,
  CheqdModule,
  CheqdModuleConfig,
} from "@aries-framework/cheqd";
import {
  ConnectionsModule,
  DidsModule,
  V2ProofProtocol,
  V2CredentialProtocol,
  ProofsModule,
  AutoAcceptProof,
  AutoAcceptCredential,
  CredentialsModule,
  Agent,
} from "@aries-framework/core";
import { agentDependencies, HttpInboundTransport } from "@aries-framework/node";
import { anoncreds } from "@hyperledger/anoncreds-nodejs";
import { ariesAskar } from "@hyperledger/aries-askar-nodejs";

type DemoAgent = Agent<ReturnType<typeof getAskarAnonCredsIndyModules>>;

export class BaseAgent {
  public port: number;
  public name: string;
  public agent!: DemoAgent;

  public constructor({ port, name }: { port: number; name: string }) {
    this.name = name;
    this.port = port;
  }

  public async initializeAgentAndConfig(config: InitConfig) {
    const legacyIndyCredentialFormatService =
      new LegacyIndyCredentialFormatService();
    const legacyIndyProofFormatService = new LegacyIndyProofFormatService();

    this.agent = new Agent({
      config,
      dependencies: agentDependencies,
      modules: getAskarAnonCredsIndyModules(),
    });

    await this.agent.initialize();

    console.log(`\nAgent ${this.name} created!\n`);
  }
}

function getAskarAnonCredsIndyModules() {
  const legacyIndyCredentialFormatService =
    new LegacyIndyCredentialFormatService();
  const legacyIndyProofFormatService = new LegacyIndyProofFormatService();

  return {
    connections: new ConnectionsModule({
      autoAcceptConnections: true,
    }),
    credentials: new CredentialsModule({
      autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
      credentialProtocols: [
        new V1CredentialProtocol({
          indyCredentialFormat: legacyIndyCredentialFormatService,
        }),
        new V2CredentialProtocol({
          credentialFormats: [
            legacyIndyCredentialFormatService,
            new AnonCredsCredentialFormatService(),
          ],
        }),
      ],
    }),
    proofs: new ProofsModule({
      autoAcceptProofs: AutoAcceptProof.ContentApproved,
      proofProtocols: [
        new V1ProofProtocol({
          indyProofFormat: legacyIndyProofFormatService,
        }),
        new V2ProofProtocol({
          proofFormats: [
            legacyIndyProofFormatService,
            new AnonCredsProofFormatService(),
          ],
        }),
      ],
    }),
    anoncreds: new AnonCredsModule({
      registries: [new CheqdAnonCredsRegistry()],
    }),
    anoncredsRs: new AnonCredsRsModule({
      anoncreds,
    }),
    cheqd: new CheqdModule(
      new CheqdModuleConfig({
        networks: [
          {
            network: "testnet",
            cosmosPayerSeed:
              "robust across amount corn curve panther opera wish toe ring bleak empower wreck party abstract glad average muffin picnic jar squeeze annual long aunt",
          },
        ],
      })
    ),
    dids: new DidsModule({
      resolvers: [new CheqdDidResolver()],
      registrars: [new CheqdDidRegistrar()],
    }),
    askar: new AskarModule({
      ariesAskar,
    }),
  } as const;
}
