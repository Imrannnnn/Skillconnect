import express from "express";
import { protect, maybeAuth } from "../middleware/authMiddleware.js";
import {
  createContent,
  listContent,
  listAuthorContent,
  getContent,
  updateContent,
  softDeleteContent,
  likeContent,
  unlikeContent,
  createComment,
  listComments,
  deleteComment,
} from "../controllers/contentController.js";

const router = express.Router();

router.post("/", protect, createContent);
router.get("/", maybeAuth, listContent);
router.get("/author/:authorId", maybeAuth, listAuthorContent);
router.get("/:id", maybeAuth, getContent);
router.put("/:id", protect, updateContent);
router.delete("/:id", protect, softDeleteContent);
router.post("/:id/like", protect, likeContent);
router.delete("/:id/like", protect, unlikeContent);

// Comment routes
router.post("/:id/comments", protect, createComment);
router.get("/:id/comments", maybeAuth, listComments);
router.delete("/:id/comments/:commentId", protect, deleteComment);

export default router;
