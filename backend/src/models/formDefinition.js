import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true }, // stable key used in responses and frontend
  label: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "text",
      "number",
      "select",
      "checkbox",
      "radio",
      "file",
      "date",
      "time",
      "datetime",
      "textarea",
    ],
    required: true,
  },
  required: { type: Boolean, default: false },
  placeholder: { type: String },
  helpText: { type: String },
  options: [{ type: String }], // for select / radio / checkbox
  min: { type: Number },
  max: { type: Number },
  pattern: { type: String },
  order: { type: Number, default: 0 },
}, { _id: false });

const formDefinitionSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
  allowAnonymous: { type: Boolean, default: false },
  fields: [fieldSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("FormDefinition", formDefinitionSchema);
