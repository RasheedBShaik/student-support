import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "STAFF" | "MANAGER" | "ADMIN";
  department?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["STUDENT", "STAFF", "MANAGER", "ADMIN"],
      default: "STUDENT",
    },

    department: {
        type: Schema.Types.ObjectId,
        ref: "Department",
        default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
