import { Issuer } from "../Issuer";
import { UniversityCredentialsContainer } from "Utils";

let issuer: Issuer;
export const InitIssuer = async () => {
  issuer = await Issuer.build();
  //await issuer.importDid();
};

export const invitationLink = async () => {
  try {
    if (!issuer) {
      await InitIssuer();
    }

    const invite = await issuer.printConnectionInvite();
    return invite;
  } catch (err) {
    console.log("Error", err);
  }
};

export const acceptConn = async () => {
  try {
    if (!issuer) {
      throw new Error("Issuer not initialized");
    }
    await issuer.waitForConnection();
    return "Connection established";
  } catch (err) {
    console.log("Error", err);
  }
};

export const credential = async (
  credential: UniversityCredentialsContainer
) => {
  try {
    if (!issuer) {
      throw new Error("Issuer not initialized");
    }
    await issuer.issueCredential(credential);
    return "Credential issued";
  } catch (err) {
    console.log("Error", err);
  }
};

export const proof = async () => {
  try {
    if (!issuer) {
      throw new Error("Issuer not initialized");
    }
    await issuer.sendProofRequest();
    return "Proof request sent";
  } catch (err) {
    console.log("Error", err);
  }
};

export const createDid = async () => {
  try {
    if (!issuer) {
      throw new Error("Issuer not initialized");
    }
    await issuer.createDid();
    return "DID created";
  } catch (err) {
    console.log("Error", err);
  }
};
