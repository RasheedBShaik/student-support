import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface ITicket extends Document {
  ticketNumber: string;

  studentId: mongoose.Types.ObjectId;

  subject: string;
  description: string;

  category:
    | "FEES"
    | "ATTENDANCE"
    | "ID_CARD"
    | "DOCUMENTS"
    | "CERTIFICATES"
    | "EXAMINATION"
    | "HOSTEL"
    | "TRANSPORT"
    | "OTHER";

  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";

  status:
    | "NEW"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "PENDING_STUDENT"
    | "PENDING_INTERNAL"
    | "RESOLVED"
    | "CLOSED";

  departmentId?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;

  sla: {
    responseDueAt?: Date;
    resolutionDueAt?: Date;
    respondedAt?: Date;
    resolvedAt?: Date;
  };

  resolution?: {
    summary?: string;
    resolvedBy?: mongoose.Types.ObjectId;
    resolvedAt?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "FEES",
        "ATTENDANCE",
        "ID_CARD",
        "DOCUMENTS",
        "CERTIFICATES",
        "EXAMINATION",
        "HOSTEL",
        "TRANSPORT",
        "OTHER",
      ],
      required: true,
    },

    priority: {
      type: String,
      enum: [
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT",
      ],
      default: "MEDIUM",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "NEW",
        "ASSIGNED",
        "IN_PROGRESS",
        "PENDING_STUDENT",
        "PENDING_INTERNAL",
        "RESOLVED",
        "CLOSED",
      ],
      default: "NEW",
      index: true,
    },

    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    sla: {
      responseDueAt: Date,
      resolutionDueAt: Date,
      respondedAt: Date,
      resolvedAt: Date,
    },

    resolution: {
      summary: String,

      resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      resolvedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

TicketSchema.index({
  studentId: 1,
  createdAt: -1,
});

TicketSchema.index({
  assignedTo: 1,
  status: 1,
});

TicketSchema.index({
  departmentId: 1,
  status: 1,
});

const Ticket: Model<ITicket> =
  mongoose.models.Ticket ||
  mongoose.model<ITicket>(
    "Ticket",
    TicketSchema
  );

export default Ticket;
