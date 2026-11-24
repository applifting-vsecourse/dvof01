export type QuackAuthor = {
  id: string;
  name: string;
  username: string;
};

export type PollOption = {
  id: string;
  text: string;
  order: number;
  voteCount: number;
};

export type Poll = {
  id: string;
  quackId: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Quack = {
  id: string;
  text: string;
  mood?: string | null;
  userId: string;
  replyToId?: string | null;
  deletedAt?: Date | null;
  replies?: Quack[];
  createdAt: Date;
  updatedAt: Date;
  user?: QuackAuthor;
  poll?: Poll | null;
  /** Number of likes; computed on read (ADR 0002). */
  likeCount?: number;
  /** Whether the requesting user likes this quack. */
  likedByMe?: boolean;
};
