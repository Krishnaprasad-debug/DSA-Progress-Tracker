import { Schema, model, Document, Types } from 'mongoose';

export const REVISION_INTERVALS = [1, 7, 30] as const;
export type RevisionInterval = (typeof REVISION_INTERVALS)[number];

export interface IRevision extends Document {
  problem: Types.ObjectId;
  user: Types.ObjectId;
  scheduledDate: Date;
  intervalDays: RevisionInterval;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const revisionSchema = new Schema<IRevision>(
  {
    problem: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      index: true,
    },
    intervalDays: {
      type: Number,
      enum: {
        values: REVISION_INTERVALS,
        message: '{VALUE} is not a valid revision interval (must be 1, 7, or 30)',
      },
      required: [true, 'Interval days is required'],
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-frequency queries
revisionSchema.index({ user: 1, completed: 1, scheduledDate: 1 });
revisionSchema.index({ user: 1, problem: 1, completed: 1 });

export const Revision = model<IRevision>('Revision', revisionSchema);
