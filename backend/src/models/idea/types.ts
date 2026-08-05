import { Document, Model, Types } from "mongoose";

export enum IdeaStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

export enum IdeaCategory {
  TECHNOLOGY = "technology",
  BUSINESS = "business",
  DESIGN = "design",
  MARKETING = "marketing",
  OTHER = "other",
}

export interface IIdea extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: IdeaStatus;
  category: IdeaCategory;
  tags: string[];
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  isOwnedBy(userId: string): boolean;
  publish(): Promise<IIdea>;
  archive(): Promise<IIdea>;
  addTag(tag: string): Promise<IIdea>;
  removeTag(tag: string): Promise<IIdea>;
}

export interface IIdeaModel extends Model<IIdea> {
  createIdea(data: CreateIdeaData): Promise<IIdea>;
  findByOwner(ownerId: string): Promise<IIdea[]>;
  getIdeas(
    page: number,
    limit: number,
    filter?: Record<string, any>,
  ): Promise<{ ideas: IIdea[]; total: number; page: number; totalPages: number }>;
  updateIdea(ideaId: string, updateData: UpdateIdeaData): Promise<IIdea>;
  deleteIdea(ideaId: string): Promise<void>;
}

export interface CreateIdeaData {
  title: string;
  description?: string;
  status?: IdeaStatus;
  category?: IdeaCategory;
  tags?: string[];
  owner: Types.ObjectId;
}

export interface UpdateIdeaData {
  title?: string;
  description?: string;
  status?: IdeaStatus;
  category?: IdeaCategory;
  tags?: string[];
}
