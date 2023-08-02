import express from "express";
import {
  getInvitationLink,
  getCredential,
  getProof,
  createDidModule,
  registerSchema,
} from "../controllers/controllers";

const router = express.Router();

router.get("/invitationLink", getInvitationLink);

router.post("/credential", getCredential);

router.get("/proof", getProof);

router.get("/createDid", createDidModule);

router.post("/registerSchema", registerSchema);

/*
router.delete("/:id", deletePet);

export default router;
*/

export default router;
