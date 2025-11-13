import express from "express";
import { getUser, listUsers } from "../controllers/userController.js";
const router = express.Router();
router.get("/", listUsers);
router.get("/:id", getUser);
export default router;
