import mongoose from "mongoose";

const responseFileSchema = new mongoose.Schema({
  fieldId: { type: String, required: true },
  originalName: { type: String, required: true },
  storedPath: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
}, { _id: true });

const formResponseSchema = new mongoose.Schema({
  form: { type: mongoose.Schema.Types.ObjectId, ref: "FormDefinition", required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  values: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  files: [responseFileSchema],
}, { timestamps: true });

export default mongoose.model("FormResponse", formResponseSchema);
