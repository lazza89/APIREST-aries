import { BaseAgent } from "./BaseAgent";
import { RegisterCredentialDefinitionReturnStateFinished } from "@aries-framework/anoncreds";
import { Color, Output, greenText, purpleText, redText } from "./OutputClass";
import { HttpInboundTransport } from "@aries-framework/node";
import {
  CreateOutOfBandInvitationConfig,
  HttpOutboundTransport,
  InitConfig,
  WsOutboundTransport,
} from "@aries-framework/core";

export class Issuer extends BaseAgent {
  public outOfBandId: string = "";

  public constructor(port: number, name: string) {
    super({ port, name });
  }

  public async initialize() {
    const config: InitConfig = {
      label: this.name,
      walletConfig: {
        id: this.name,
        key: this.name,
      },
    };

    await this.initializeAgentAndConfig(config);
    this.agent.registerOutboundTransport(new WsOutboundTransport());

    this.agent.registerOutboundTransport(new HttpOutboundTransport());

    this.agent.registerInboundTransport(
      new HttpInboundTransport({ port: this.port })
    );
  }

  public async printInvite(): Promise<string> {
    let config: CreateOutOfBandInvitationConfig = {
      label: this.name,
      handshake: true,
      multiUseInvitation: false,
      autoAcceptConnection: true,
    };
    const outOfBand = await this.agent.oob.createInvitation(config);

    this.outOfBandId = outOfBand.id;
    const connectionInvite = outOfBand.outOfBandInvitation.toUrl({
      domain: `http://localhost:${this.port}`,
    });

    console.log(Output.ConnectionLink, connectionInvite, "\n");
    return connectionInvite;
  }
}
