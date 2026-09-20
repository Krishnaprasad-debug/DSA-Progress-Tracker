import { Schema, model, Document, Types } from 'mongoose';

export const TOPICS = [
  'Arrays',
  'Strings',
  'Linked List',
  'Stack',
  'Queue',
  'Hashing',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Divide and Conquer',
  'Sorting',
  'Searching',
  'Bit Manipulation',
  'Recursion',
] as const;

export type Topic = (typeof TOPICS)[number];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const PLATFORMS = [
  'LeetCode',
  'HackerRank',
  'CodeChef',
  'GeeksforGeeks',
  'Other',
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const STATUSES = [
  'Not Started',
  'Attempted',
  'Solved',
  'Mastered',
] as const;
export type ProblemStatus = (typeof STATUSES)[number];

export interface IProblem extends Document {
  user: Types.ObjectId;
  title: string;
  description: string;
  topic: Topic;
  difficulty: Difficulty;
  platform: Platform;
  problemUrl: string;
  status: ProblemStatus;
  notes: string;
  tags: string[];
  estimatedTimeMinutes: number;
  lastPracticedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const problemSchema = new Schema<IProblem>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User association is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    topic: {
      type: String,
      enum: {
        values: TOPICS,
        message: '{VALUE} is not a supported topic',
      },
      required: [true, 'Topic category is required'],
    },
    difficulty: {
      type: String,
      enum: {
        values: DIFFICULTIES,
        message: '{VALUE} is not a valid difficulty level',
      },
      required: [true, 'Difficulty level is required'],
    },
    platform: {
      type: String,
      enum: {
        values: PLATFORMS,
        message: '{VALUE} is not a recognized platform',
      },
      default: 'LeetCode',
    },
    problemUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: '{VALUE} is not a recognized problem status',
      },
      default: 'Not Started',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    estimatedTimeMinutes: {
      type: Number,
      default: 30,
      min: [1, 'Estimated time must be at least 1 minute'],
      max: [600, 'Estimated time cannot exceed 600 minutes'],
    },
    lastPracticedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize compound queries for topic filtering and analytics
problemSchema.index({ user: 1, topic: 1 });
problemSchema.index({ user: 1, status: 1 });
problemSchema.index({ user: 1, difficulty: 1 });

export const Problem = model<IProblem>('Problem', problemSchema);
export default Problem;
