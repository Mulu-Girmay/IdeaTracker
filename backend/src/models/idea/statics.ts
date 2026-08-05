import { IIdea, IIdeaModel, CreateIdeaData, UpdateIdeaData } from "./types.js";
import { NotFoundError, ForbiddenError } from "../../error/ApiError.js";

export const createIdea = async function (
  this: IIdeaModel,
  data: CreateIdeaData,
): Promise<IIdea> {
  const idea = new this(data);
  await idea.save();
  return idea;
};

export const findByOwner = async function (
  this: IIdeaModel,
  ownerId: string,
): Promise<IIdea[]> {
  return this.find({ owner: ownerId }).sort({ createdAt: -1 });
};

export const getIdeas = async function (
  this: IIdeaModel,
  page: number = 1,
  limit: number = 10,
  filter: Record<string, any> = {},
): Promise<{ ideas: IIdea[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * limit;
  const [ideas, total] = await Promise.all([
    this.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate("owner", "name email"),
    this.countDocuments(filter),
  ]);
  return { ideas, total, page, totalPages: Math.ceil(total / limit) };
};

export const updateIdea = async function (
  this: IIdeaModel,
  ideaId: string,
  updateData: UpdateIdeaData,
): Promise<IIdea> {
  const idea = await this.findByIdAndUpdate(ideaId, updateData, {
    new: true,
    runValidators: true,
  });
  if (!idea) throw new NotFoundError("Idea not found");
  return idea;
};

export const deleteIdea = async function (
  this: IIdeaModel,
  ideaId: string,
): Promise<void> {
  const idea = await this.findByIdAndDelete(ideaId);
  if (!idea) throw new NotFoundError("Idea not found");
};

export const ideaStatics = {
  createIdea,
  findByOwner,
  getIdeas,
  updateIdea,
  deleteIdea,
};

export default ideaStatics;
