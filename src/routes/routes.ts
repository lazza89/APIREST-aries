import express from "express";
import {
    getInvitationLink,
    getCredential,
    getProof,
} from "../controllers/controllers";

const router = express.Router();

router.get("/invitationLink", getInvitationLink);

router.get("/credential", getCredential);

router.get("/proof", getProof);

/*
router.post("/", addPet);

router.delete("/:id", deletePet);

export default router;
*/

export default router;
