import express from "express";
import {
  getInvitationLink,
  getCredential,
  getProof,
  createDidModule,
} from "../controllers/controllers";

const router = express.Router();

router.get("/invitationLink", getInvitationLink);

router.post("/credential", getCredential);

router.get("/proof", getProof);

router.get("/createDid", createDidModule);

/*
router.delete("/:id", deletePet);

export default router;
*/

export default router;
