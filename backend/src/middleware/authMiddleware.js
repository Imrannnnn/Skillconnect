import jwt from "jsonwebtoken";

export function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.substring(7) : null;
    let user = null;
    if (token) {
      try { user = jwt.verify(token, process.env.JWT_SECRET || "devsecret"); } catch {}
    }
    if (!user?._id) {
      // fallback: allow dev by x-user-id
      const userId = req.headers["x-user-id"]; 
      if (userId) user = { _id: userId };
    }
    if (!user?._id) return res.status(401).json({ message: "Unauthorized" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
