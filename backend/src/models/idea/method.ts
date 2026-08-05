import { IIdea, IdeaStatus } from "./types.js";

export const isOwnedBy = function (this: IIdea, userId: string): boolean {
  return this.owner.toString() === userId.toString();
};

export const publish = async function (this: IIdea): Promise<IIdea> {
  this.status = IdeaStatus.PUBLISHED;
  return this.save();
};

export const archive = async function (this: IIdea): Promise<IIdea> {
  this.status = IdeaStatus.ARCHIVED;
  return this.save();
};

export const addTag = async function (this: IIdea, tag: string): Promise<IIdea> {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return this;
};

export const removeTag = async function (this: IIdea, tag: string): Promise<IIdea> {
  this.tags = this.tags.filter((t) => t !== tag);
  return this.save();
};

export const ideaMethods = {
  isOwnedBy,
  publish,
  archive,
  addTag,
  removeTag,
};

export default ideaMethods;
