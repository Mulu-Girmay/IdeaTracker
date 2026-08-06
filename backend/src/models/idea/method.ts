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

export const ideaMethods = {
  isOwnedBy,
  publish,
  archive,
};

export default ideaMethods;
