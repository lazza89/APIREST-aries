import { IssuerController } from "../IssuerController";

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
    return err.message;
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
    return err.message;
  }
};

export const credential = async (credential: any) => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    const ret = await issuerController.issueCredential(credential);
    return ret;
  } catch (err) {
    console.log("Error", err);
    return err.message;
  }
};

export const proof = async (attribute: any) => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    const ret = await issuerController.sendProofRequest(attribute);
    return ret;
  } catch (err) {
    console.log("Error", err);
    return err.message;
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
    return err.message;
  }
};

export const newSchema = async (schema: any) => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    const ret = await issuerController.createSchemaAndCredDef(schema);

    return ret;
  } catch (err) {
    console.log("Error", err);
    return err.message;
  }
};

export const isConn = async () => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    const ret = await issuerController.isConnected();

    return ret;
  } catch (err) {
    console.log("Error", err);
    return err.message;
  }
};

export const credStatus = async () => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    const ret = await issuerController.credentialStatus();

    return ret;
  } catch (err) {
    console.log("Error", err);
    return err.message;
  }
};

export const proofStat = async () => {
  try {
    if (!issuerController) {
      throw new Error("Issuer not initialized");
    }
    const ret = await issuerController.proofStatus();

    return ret;
  } catch (err) {
    console.log("Error", err);
    return err.message;
  }
};
