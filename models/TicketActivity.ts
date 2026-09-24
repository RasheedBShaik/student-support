import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicketActivity extends Document {
  ticketId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;

  type:
    | "CREATED"
    | "ASSIGNED"
    | "REASSIGNED"
    | "STATUS_CHANGED"
    | "PRIORITY_CHANGED"
    | "COMMENT_ADDED"
    | "PENDING"
    | "RESUMED"
    | "RESOLVED"
    | "REOPENED"
    | "CLOSED"
    | "ESCALATED";

  fromValue?: string;
  toValue?: string;

  comment?: string;

  createdAt: Date;
}

const TicketActivitySchema = new Schema<ITicketActivity>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "CREATED",
        "ASSIGNED",
        "REASSIGNED",
        "STATUS_CHANGED",
        "PRIORITY_CHANGED",
        "COMMENT_ADDED",
        "PENDING",
        "RESUMED",
        "RESOLVED",
        "REOPENED",
        "CLOSED",
        "ESCALATED",
      ],
      required: true,
    },

    fromValue: {
      type: String,
    },

    toValue: {
      type: String,
    },

    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

const TicketActivity: Model<ITicketActivity> =
  mongoose.models.TicketActivity ||
  mongoose.model<ITicketActivity>(
    "TicketActivity",
    TicketActivitySchema
  );

export default TicketActivity;
