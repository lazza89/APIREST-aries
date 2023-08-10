import type { Issuer } from "./Issuer";
import type {
  Agent,
  BasicMessageStateChangedEvent,
  CredentialExchangeRecord,
  CredentialStateChangedEvent,
  ProofExchangeRecord,
  ProofStateChangedEvent,
} from "@aries-framework/core";
import type BottomBar from "inquirer/lib/ui/bottom-bar";

import {
  BasicMessageEventTypes,
  BasicMessageRole,
  CredentialEventTypes,
  CredentialState,
  ProofEventTypes,
  ProofState,
} from "@aries-framework/core";
import { ui } from "inquirer";

import { Color, purpleText } from "./OutputClass";

export class Listener {
  public on: boolean;
  private ui: BottomBar;

  public constructor() {
    this.on = false;
    this.ui = new ui.BottomBar();
  }

  private turnListenerOn() {
    this.on = true;
  }

  private turnListenerOff() {
    this.on = false;
  }

  private printCredentialAttributes(
    credentialRecord: CredentialExchangeRecord
  ) {
    if (credentialRecord.credentialAttributes) {
      const attribute = credentialRecord.credentialAttributes;
      console.log("\n\nCredential preview:");
      attribute.forEach((element) => {
        console.log(
          purpleText(`${element.name} ${Color.Reset}${element.value}`)
        );
      });
    }
  }

  public messageListener(agent: Agent, name: string) {
    agent.events.on(
      BasicMessageEventTypes.BasicMessageStateChanged,
      async (event: BasicMessageStateChangedEvent) => {
        if (
          event.payload.basicMessageRecord.role === BasicMessageRole.Receiver
        ) {
          this.ui.updateBottomBar(
            purpleText(
              `\n${name} received a message: ${event.payload.message.content}\n`
            )
          );
        }
      }
    );
  }

  public proofAcceptedListener(faber: Issuer) {
    faber.agent.events.on(
      ProofEventTypes.ProofStateChanged,
      async ({ payload }: ProofStateChangedEvent) => {
        if (payload.proofRecord.state === ProofState.Done) {
          console.log("\n\nProof accepted");
        }
      }
    );
  }
}
