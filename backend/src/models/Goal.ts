import { Schema, model, Document, Types } from 'mongoose';
import { TOPICS, Topic } from './Problem';

export const GOAL_TYPES = [
  'weekly_problems',
  'topic_mastery',
  'practice_time',
  'custom',
] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export const GOAL_STATUSES = ['active', 'completed', 'cancelled'] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export interface IGoal extends Document {
  user: Types.ObjectId;
  title: string;
  description?: string;
  type: GoalType;
  targetValue: number;
  currentValue?: number;
  progressPercentage?: number;
  topic?: Topic;
  deadline?: Date | null;
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [100, 'Goal title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Goal description cannot exceed 300 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: {
        values: GOAL_TYPES,
        message: '{VALUE} is not a valid goal type',
      },
      required: [true, 'Goal type is required'],
    },
    targetValue: {
      type: Number,
      required: [true, 'Target value is required'],
      min: [1, 'Target value must be at least 1'],
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
    topic: {
      type: String,
      enum: {
        values: TOPICS,
        message: '{VALUE} is not a valid topic',
      },
      required: function (this: IGoal) {
        return this.type === 'topic_mastery';
      },
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: GOAL_STATUSES,
        message: '{VALUE} is not a valid goal status',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active user goals
goalSchema.index({ user: 1, status: 1, type: 1 });

export const Goal = model<IGoal>('Goal', goalSchema);
export default Goal;
