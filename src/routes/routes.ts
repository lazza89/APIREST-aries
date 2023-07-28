import express from "express";
import {
    getInvitationLink
} from "../controllers/controllers";

const router = express.Router();

router.get("/invitationLink", getInvitationLink);

/*
router.get("/:id", getPet);

router.put("/:id", editPet);

router.post("/", addPet);

router.delete("/:id", deletePet);

export default router;
*/

export default router;
