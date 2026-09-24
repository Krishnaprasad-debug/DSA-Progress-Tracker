import { Schema, model, Document, Types } from 'mongoose';

export const ASSESSMENT_STATUSES = [
  'configured',
  'in_progress',
  'completed',
  'expired',
] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const ASSESSMENT_VERDICTS = [
  'strong_hire',
  'hire',
  'leaning_hire',
  'needs_practice',
  'pending',
] as const;
export type AssessmentVerdict = (typeof ASSESSMENT_VERDICTS)[number];

export const PROBLEM_ASSESSMENT_STATUSES = [
  'unsolved',
  'solved',
  'failed',
] as const;
export type ProblemAssessmentStatus =
  (typeof PROBLEM_ASSESSMENT_STATUSES)[number];

export interface IAssessmentProblem {
  problem: Types.ObjectId;
  pointWeight: number;
  status: ProblemAssessmentStatus;
  attempts: number;
  timeTakenMinutes: number;
  solvedAt?: Date | null;
  notes?: string;
}

export interface IAssessment extends Document {
  user: Types.ObjectId;
  title: string;
  description?: string;
  durationMinutes: number;
  status: AssessmentStatus;
  problems: IAssessmentProblem[];
  startTime?: Date | null;
  endTime?: Date | null;
  score: number;
  maxScore: number;
  timeSpentMinutes: number;
  verdict: AssessmentVerdict;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentProblemSchema = new Schema<IAssessmentProblem>(
  {
    problem: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: [true, 'Problem reference is required'],
    },
    pointWeight: {
      type: Number,
      required: [true, 'Point weight is required'],
      min: [10, 'Point weight must be at least 10'],
    },
    status: {
      type: String,
      enum: {
        values: PROBLEM_ASSESSMENT_STATUSES,
        message: '{VALUE} is not a valid problem assessment status',
      },
      default: 'unsolved',
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeTakenMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    solvedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const assessmentSchema = new Schema<IAssessment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [10, 'Duration must be at least 10 minutes'],
      max: [240, 'Duration cannot exceed 240 minutes'],
      default: 60,
    },
    status: {
      type: String,
      enum: {
        values: ASSESSMENT_STATUSES,
        message: '{VALUE} is not a valid assessment status',
      },
      default: 'configured',
      index: true,
    },
    problems: {
      type: [assessmentProblemSchema],
      validate: {
        validator: function (val: IAssessmentProblem[]) {
          return val && val.length >= 1 && val.length <= 10;
        },
        message: 'An assessment must contain between 1 and 10 problems',
      },
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    timeSpentMinutes: {
      type: Number,
      default: 0,
    },
    verdict: {
      type: String,
      enum: {
        values: ASSESSMENT_VERDICTS,
        message: '{VALUE} is not a valid assessment verdict',
      },
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user assessments by status and creation date
assessmentSchema.index({ user: 1, status: 1, createdAt: -1 });

export const Assessment = model<IAssessment>('Assessment', assessmentSchema);
export default Assessment;
