import { IssuerController } from "../IssuerController";
import { UniversityCredentialsContainer } from "Utils";

let issuerController: IssuerController;
export const InitIssuerController = async () => {
  issuerController = new IssuerController();
  await issuerController.init();
};

export const invitationLink = async () => {
  try {
    if (!issuerController) {
      await InitIssuerController();
    }

    const invite = await issuerController.invitationLink();
    return invite;
  } catch (err) {
    console.log("Error", err);
  }
};

export const acceptConn = async () => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    await issuerController.waitForConnection();
    return "Connection established";
  } catch (err) {
    console.log("Error", err);
  }
};

export const credential = async (
  credential: UniversityCredentialsContainer
) => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    await issuerController.issueCredential(credential);
    return "Credential issued";
  } catch (err) {
    console.log("Error", err);
  }
};

export const proof = async () => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    await issuerController.sendProofRequest();
    return "Proof request sent";
  } catch (err) {
    console.log("Error", err);
  }
};

export const createDid = async () => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    await issuerController.createDid();
    return "DID created";
  } catch (err) {
    console.log("Error", err);
  }
};

export const newSchema = async (schema: any) => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    const ret = await issuerController.createSchema(schema);

    return ret;
  } catch (err) {
    console.log("Error", err);
  }
};
