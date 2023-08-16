import { readJsonFile, writeJsonFile, SchemaAndCredDefInLedger, IssuerCredentialStatus, IssuerProofStatus } from "./Utils";

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

  public credentialListener(issuer: Issuer) {
    issuer.agent.events.on(CredentialEventTypes.CredentialStateChanged, async ({payload}: CredentialStateChangedEvent) => {
      
      issuer.issuerCredentialStatus = IssuerCredentialStatus.NONE;

      if(payload.credentialRecord.state === CredentialState.CredentialIssued){
        console.log("\n\nCredential offer sent!");
        issuer.issuerCredentialStatus = IssuerCredentialStatus.ISSUED;
      }else if(payload.credentialRecord.state === CredentialState.Done){
        console.log("\n\nCredential accepted!");
        issuer.issuerCredentialStatus = IssuerCredentialStatus.ACCEPTED;
      }else if(payload.credentialRecord.state === CredentialState.Declined){
        console.log("\n\nCredential declined!");
        issuer.issuerCredentialStatus = IssuerCredentialStatus.DECLINED;
      }

    })
  }

  public proofAcceptedListener(issuer: Issuer) {
    issuer.agent.events.on(
      ProofEventTypes.ProofStateChanged,
      async ({ payload }: ProofStateChangedEvent) => {
        if (payload.proofRecord.state === ProofState.Done) {
          console.log("\n\nProof accepted");
          issuer.issuerProofStatus = IssuerProofStatus.ACCEPTED;
        } else if (
          payload.proofRecord.state === ProofState.Declined ||
          payload.proofRecord.state === ProofState.Abandoned
        ) {
          console.log("\n\nProof rejected");
          issuer.issuerProofStatus = IssuerProofStatus.DECLINED;
        } else if (payload.proofRecord.state === ProofState.RequestSent) {
          console.log("\n\nProof requested");
          issuer.issuerProofStatus = IssuerProofStatus.ON_HOLD;
        }
      }
    );
  }
}
