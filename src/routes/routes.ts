import express from "express";
import {
  getInvitationLink,
  getCredential,
  getProof,
  createDidModule,
  registerSchema,
  isConnected,
  credentialSatus,
  proofStatus,
} from "../controllers/controllers";

const router = express.Router();

router.get("/invitationLink", getInvitationLink);

router.get("/isConnected", isConnected);

router.post("/credential", getCredential);

router.get("/credentialStatus", credentialSatus);

router.post("/proof", getProof);

router.get("/proofStatus", proofStatus);

router.get("/createDid", createDidModule);

router.post("/registerSchema", registerSchema);

/*
router.delete("/:id", deletePet);

export default router;
*/

export default router;
