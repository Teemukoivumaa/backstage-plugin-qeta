import {
  Answer,
  Attachment,
  Collection,
  Comment,
  GlobalStat,
  Post,
  PostType,
  Statistic,
  StatisticsRequestParameters,
  UserEntitiesResponse,
  UserStat,
  UserTagsResponse,
} from '@drodil/backstage-plugin-qeta-common';
import { QetaFilters } from '../service/util';
import { PermissionCriteria } from '@backstage/plugin-permission-common';

export function isQuestion(entity: Post | Answer | Comment): entity is Post {
  return 'answers' in entity;
}

export function isAnswer(entity: Post | Answer | Comment): entity is Answer {
  return !('answers' in entity);
}

export type MaybeAnswer = Answer | null;
export type MaybePost = Post | null;
export type MaybeComment = Comment | null;
export type MaybeCollection = Collection | null;

export interface Posts {
  posts: Post[];
  total: number;
}

export interface Answers {
  answers: Answer[];
  total: number;
}

export interface Collections {
  collections: Collection[];
  total: number;
}

export interface CollectionOptions {
  limit?: number;
  offset?: number;
  owner?: string;
  searchQuery?: string;
  orderBy?: 'created' | 'owner';
  order?: 'desc' | 'asc';
}

export interface PostOptions {
  type?: PostType;
  limit?: number;
  offset?: number;
  author?: string | string[];
  orderBy?:
    | 'views'
    | 'score'
    | 'answersCount'
    | 'created'
    | 'updated'
    | 'trend';
  order?: 'desc' | 'asc';
  noCorrectAnswer?: boolean;
  noAnswers?: boolean;
  noVotes?: boolean;
  favorite?: boolean;
  tags?: string[];
  entity?: string;
  includeAnswers?: boolean;
  includeVotes?: boolean;
  includeEntities?: boolean;
  includeTrend?: boolean;
  random?: boolean;
  searchQuery?: string;
  fromDate?: string;
  toDate?: string;
  collectionId?: number;
}

export interface AnswersOptions {
  limit?: number;
  offset?: number;
  author?: string;
  noCorrectAnswer?: boolean;
  noVotes?: boolean;
  orderBy?:
    | 'views'
    | 'score'
    | 'answersCount'
    | 'created'
    | 'updated'
    | 'trend';
  order?: 'desc' | 'asc';
  tags?: string[];
  entity?: string;
  searchQuery?: string;
  fromDate?: string;
  toDate?: string;
}

export interface TagResponse {
  id: number;
  tag: string;
  description?: string;
  postsCount: number;
  followerCount: number;
}

export interface EntityResponse {
  id: number;
  entityRef: string;
  postsCount: number;
  followerCount: number;
}

export interface UserResponse {
  userRef: string;
  totalViews: number;
  totalQuestions: number;
  totalAnswers: number;
  totalComments: number;
  totalVotes: number;
  totalArticles: number;
}

export interface AttachmentParameters {
  uuid: string;
  locationType: string;
  locationUri: string;
  extension: string;
  mimeType: string;
  path?: string;
  binaryImage?: Buffer;
  creator?: string;
}

/**
 * Interface for fetching and modifying Q&A data
 */
export interface QetaStore {
  /**
   * Fetch all stored posts with options
   * @param user_ref user name requesting post
   * @param options Search options
   * @param filters Permission filters
   */
  getPosts(
    user_ref: string,
    options: PostOptions,
    filters?: PermissionCriteria<QetaFilters>,
  ): Promise<Posts>;

  /**
   * Fetch single question by id
   * Question views count is increased after fetching the question
   * @param user_ref user name requesting question
   * @param id question id
   * @param recordView record question view, default true
   */
  getPost(
    user_ref: string,
    id: number,
    recordView?: boolean,
  ): Promise<MaybePost>;

  /**
   * Fetch single question by answer id
   * Question views count is increased after fetching the question
   * @param user_ref user name requesting question
   * @param answerId answer id
   * @param recordView record question view, default true
   */
  getPostByAnswerId(
    user_ref: string,
    answerId: number,
    recordView?: boolean,
  ): Promise<MaybePost>;

  /**
   * Post new post
   */
  createPost(options: {
    user_ref: string;
    title: string;
    content: string;
    created: Date;
    tags?: string[];
    entities?: string[];
    images?: number[];
    anonymous?: boolean;
    type?: PostType;
    headerImage?: string;
  }): Promise<Post>;

  /**
   * Comment question
   * @param question_id question id
   * @param user_ref user
   * @param content comment content
   * @param created
   */
  commentPost(
    question_id: number,
    user_ref: string,
    content: string,
    created: Date,
  ): Promise<MaybePost>;

  /**
   * Delete question comment
   * @param question_id question id
   * @param id comment id
   * @param user_ref username
   */
  deletePostComment(
    question_id: number,
    id: number,
    user_ref: string,
  ): Promise<MaybePost>;

  /**
   * Update question
   */
  updatePost(options: {
    id: number;
    user_ref: string;
    title: string;
    content: string;
    tags?: string[];
    entities?: string[];
    images?: number[];
    headerImage?: string;
  }): Promise<MaybePost>;

  /**
   * Delete question. Only the user who created the question can delete it.
   * @param id question id
   */
  deletePost(id: number): Promise<boolean>;

  /**
   * Answer question
   * @param user_ref user name of the user answering question
   * @param questionId question id
   * @param answer answer content
   * @param created
   * @param images
   * @param anonymous
   */
  answerPost(
    user_ref: string,
    questionId: number,
    answer: string,
    created: Date,
    images?: number[],
    anonymous?: boolean,
  ): Promise<MaybeAnswer>;

  /**
   * Comment answer
   * @param answer_id answer id
   * @param user_ref user commenting
   * @param content comment content
   */
  commentAnswer(
    answer_id: number,
    user_ref: string,
    content: string,
    created: Date,
  ): Promise<MaybeAnswer>;

  /**
   * Delete answer comment
   * @param answer_id answer id
   * @param id comment id
   * @param user_ref username
   */
  deleteAnswerComment(
    answer_id: number,
    id: number,
    user_ref: string,
  ): Promise<MaybeAnswer>;

  /**
   * Update answer to a question
   * @param user_ref user name of the user updating the answer
   * @param questionId question id
   * @param answerId answer id
   * @param answer answer content
   * @param images
   */
  updateAnswer(
    user_ref: string,
    questionId: number,
    answerId: number,
    answer: string,
    images?: number[],
  ): Promise<MaybeAnswer>;

  /**
   * Fetch all stored answers with options
   * @param user_ref user name requesting question
   * @param options Search options
   * @param filters Permission filters
   */
  getAnswers(
    user_ref: string,
    options: AnswersOptions,
    filters?: PermissionCriteria<QetaFilters>,
  ): Promise<Answers>;

  /** Get answer by id
   * @param answerId answer id
   * @param user_ref user name of the user getting answer
   */
  getAnswer(answerId: number, user_ref: string): Promise<MaybeAnswer>;

  getPostComment(commentId: number): Promise<MaybeComment>;
  getAnswerComment(commentId: number): Promise<MaybeComment>;

  /**
   * Delete answer. Only the user who created the answer can delete it.
   * @param id answer id
   */
  deleteAnswer(id: number): Promise<boolean>;

  /**
   * Vote question with given score
   * @param user_ref user name of the user voting question
   * @param questionId question id
   * @param score score to vote with
   */
  votePost(
    user_ref: string,
    questionId: number,
    score: number,
  ): Promise<boolean>;

  /**
   * Vote answer with given score
   * @param user_ref user name of the user voting answer
   * @param answerId answwer id
   * @param score score to vote with
   */
  voteAnswer(
    user_ref: string,
    answerId: number,
    score: number,
  ): Promise<boolean>;

  /**
   * Mark answer correct for question. Only user who created the question can mark answer correct
   * @param questionId question id
   * @param answerId answer id
   */
  markAnswerCorrect(questionId: number, answerId: number): Promise<boolean>;

  /**
   * Mark answer incorrect for question. Only user who created the question can mark answer incorrect
   * @param questionId question id
   * @param answerId answer id
   */
  markAnswerIncorrect(questionId: number, answerId: number): Promise<boolean>;

  /**
   * Mark question favorite for user
   * @param user_ref user name of the user voting question
   * @param questionId question id
   */
  favoritePost(user_ref: string, questionId: number): Promise<boolean>;

  /**
   * Mark question unfavorite for user
   * @param user_ref user name of the user voting question
   * @param questionId question id
   */
  unfavoritePost(user_ref: string, questionId: number): Promise<boolean>;

  /**
   * Returns all used tags for posts
   */
  getTags(options?: { noDescription?: boolean }): Promise<TagResponse[]>;
  getTag(tag: string): Promise<TagResponse | null>;
  updateTag(tag: string, description?: string): Promise<TagResponse | null>;

  getUsers(): Promise<UserResponse[]>;
  getUser(user_ref: string): Promise<UserResponse | null>;
  /**
   * Gets all tags user is following
   * @param user_ref
   */
  getUserTags(user_ref: string): Promise<UserTagsResponse>;
  getUsersForTags(tags?: string[]): Promise<string[]>;

  followTag(user_ref: string, tag: string): Promise<boolean>;
  unfollowTag(user_ref: string, tag: string): Promise<boolean>;

  getUserEntities(user_ref: string): Promise<UserEntitiesResponse>;
  getUsersForEntities(entityRefs?: string[]): Promise<string[]>;

  followEntity(user_ref: string, entityRef: string): Promise<boolean>;
  unfollowEntity(user_ref: string, entityRef: string): Promise<boolean>;

  getEntities(): Promise<EntityResponse[]>;
  getEntity(entity_ref: string): Promise<EntityResponse | null>;

  postAttachment({
    uuid,
    locationType,
    locationUri,
    extension,
    mimeType,
    binaryImage,
    path,
    creator,
  }: AttachmentParameters): Promise<Attachment>;

  getAttachment(uuid: string): Promise<Attachment | undefined>;

  getMostUpvotedPosts({
    author,
    options,
  }: StatisticsRequestParameters): Promise<Statistic[]>;
  getTotalPosts({
    author,
    options,
  }: StatisticsRequestParameters): Promise<Statistic[]>;
  getMostUpvotedAnswers({
    author,
    options,
  }: StatisticsRequestParameters): Promise<Statistic[]>;
  getMostUpvotedCorrectAnswers({
    author,
    options,
  }: StatisticsRequestParameters): Promise<Statistic[]>;
  getTotalAnswers({
    author,
    options,
  }: StatisticsRequestParameters): Promise<Statistic[]>;
  getCount(
    table: string,
    filters?: { author?: string; type?: PostType },
  ): Promise<number>;
  saveGlobalStats(date: Date): Promise<void>;
  saveUserStats(user: UserResponse, date: Date): Promise<void>;
  getTotalViews(
    user_ref: string,
    lastDays?: number,
    excludeUser?: boolean,
  ): Promise<number>;
  cleanStats(days: number, date: Date): Promise<void>;
  getGlobalStats(): Promise<GlobalStat[]>;
  getUserStats(user_ref: string): Promise<UserStat[]>;

  getCollections(
    user_ref: string,
    options: CollectionOptions,
    filters?: PermissionCriteria<QetaFilters>,
  ): Promise<Collections>;

  getCollection(
    user_ref: string,
    id: number,
    filters?: PermissionCriteria<QetaFilters>,
  ): Promise<MaybeCollection>;

  createCollection(options: {
    user_ref: string;
    title: string;
    description?: string;
    created: Date;
    readAccess: string;
    editAccess: string;
    images?: number[];
    headerImage?: string;
  }): Promise<Collection>;

  updateCollection(options: {
    id: number;
    user_ref: string;
    title: string;
    description?: string;
    readAccess?: string;
    editAccess?: string;
    images?: number[];
    headerImage?: string;
  }): Promise<MaybeCollection>;

  deleteCollection(id: number): Promise<boolean>;

  addPostToCollection(
    user_ref: string,
    id: number,
    postId: number,
    filters?: PermissionCriteria<QetaFilters>,
  ): Promise<MaybeCollection>;
  removePostFromCollection(
    user_ref: string,
    id: number,
    postId: number,
    filters?: PermissionCriteria<QetaFilters>,
  ): Promise<MaybeCollection>;
}
