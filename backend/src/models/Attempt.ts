import { Schema, model, Document, Types } from 'mongoose';

export const ATTEMPT_RESULTS = ['Solved', 'Failed'] as const;
export type AttemptResult = (typeof ATTEMPT_RESULTS)[number];

export interface IAttempt extends Document {
  problem: Types.ObjectId;
  user: Types.ObjectId;
  attemptNumber: number;
  result: AttemptResult;
  timeTakenMinutes: number;
  notes: string;
  attemptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attemptSchema = new Schema<IAttempt>(
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
    attemptNumber: {
      type: Number,
      required: [true, 'Attempt number is required'],
      min: [1, 'Attempt number must be at least 1'],
    },
    result: {
      type: String,
      enum: {
        values: ATTEMPT_RESULTS,
        message: '{VALUE} is not a valid attempt result',
      },
      required: [true, 'Result is required'],
    },
    timeTakenMinutes: {
      type: Number,
      required: [true, 'Time taken is required'],
      min: [1, 'Time taken must be at least 1 minute'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch attempts for a user's problem in chronological order
attemptSchema.index({ problem: 1, user: 1, attemptNumber: 1 });
attemptSchema.index({ user: 1, attemptedAt: -1 });

export const Attempt = model<IAttempt>('Attempt', attemptSchema);
