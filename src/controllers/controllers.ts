import {
  invitationLink,
  acceptConn,
  credential,
  proof,
  createDid,
  newSchema,
  isConn,
  credStatus,
  proofStat,
} from "../models/models";

export const getInvitationLink = async (req: any, res: any) => {
  try {
    const resp = await invitationLink();
    res.status(200).json(resp);
    await acceptConn();
  } catch (err) {
    res.status(500).send(err);
  }
};

export const getCredential = async (req: any, res: any) => {
  try {
    const resp = await credential(req.body);
    res.status(200).json(resp);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const getProof = async (req: any, res: any) => {
  try {
    const resp = await proof(req.body);
    res.status(200).json(resp);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const createDidModule = async (req: any, res: any) => {
  try {
    const resp = await createDid();
    res.status(200).json(resp);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const registerSchema = async (req: any, res: any) => {
  try {
    const resp = await newSchema(req.body);
    res.status(200).json(resp);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const isConnected = async (req: any, res: any) => {
  try {
    const resp = await isConn();
    res.status(200).json(resp);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const credentialSatus = async (req: any, res: any) => {
  try {
    const resp = await credStatus();
    res.status(200).json(resp);
  } catch (err) {
    res.status(500).send(err);
  }
};

export const proofStatus = async (req: any, res: any) => {
  try {
    const resp = await proofStat();
    res.status(200).json(resp);
  } catch (err) {
    res.status(500).send(err);
  }
};