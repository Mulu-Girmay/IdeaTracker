import { Request, Response, NextFunction } from "express";
import Idea from "../models/idea/index.js";
import { logger } from "../config/winston.js";
import { NotFoundError, ForbiddenError } from "../error/ApiError.js";
import { CreateIdeaData, UpdateIdeaData } from "../models/idea/types.js";
import { IUser, UserRole } from "../models/user/types.js";
import { Types } from "mongoose";

export const createIdea = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, description, status, category, tags } = req.body;

    const data: CreateIdeaData = {
      title,
      description,
      status,
      category,
      tags,
      owner: req.userId as Types.ObjectId,
    };

    const idea = await Idea.createIdea(data);

    res
      .status(201)
      .json({
        success: true,
        message: "Idea created successfully",
        data: idea,
      });
  } catch (error) {
    logger.error("Error in createIdea controller", { error });
    next(error);
  }
};

export const getAllIdeas = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { status, category, search } = req.query;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search as string };

    const result = await Idea.getIdeas(page, limit, filter);

    res.status(200).json({
      success: true,
      data: {
        ideas: result.ideas,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit,
        },
      },
    });
  } catch (error) {
    logger.error("Error in getAllIdeas controller", { error });
    next(error);
  }
};

export const getMyIdeas = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { status, category } = req.query;

    const filter: Record<string, any> = { owner: req.userId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const result = await Idea.getIdeas(page, limit, filter);

    res.status(200).json({
      success: true,
      data: {
        ideas: result.ideas,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit,
        },
      },
    });
  } catch (error) {
    logger.error("Error in getMyIdeas controller", { error });
    next(error);
  }
};

export const getIdeaById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idea = await Idea.findById(req.params.id).populate(
      "owner",
      "name email",
    );
    if (!idea) throw new NotFoundError("Idea not found");

    const user = req.user as IUser;
    const isOwner = idea.owner.toString() === req.userId?.toString();
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin)
      throw new ForbiddenError("You do not have access to this idea");

    res.status(200).json({ success: true, data: idea });
  } catch (error) {
    logger.error("Error in getIdeaById controller", { error });
    next(error);
  }
};

export const updateIdea = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) throw new NotFoundError("Idea not found");

    const user = req.user as IUser;
    const isOwner = idea.owner.toString() === req.userId?.toString();
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin)
      throw new ForbiddenError("You are not authorized to update this idea");

    const { title, description, status, category, tags } = req.body;
    const updateData: UpdateIdeaData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;

    const updated = await Idea.updateIdea(req.params.id as string, updateData);

    res
      .status(200)
      .json({
        success: true,
        message: "Idea updated successfully",
        data: updated,
      });
  } catch (error) {
    logger.error("Error in updateIdea controller", { error });
    next(error);
  }
};

export const deleteIdea = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) throw new NotFoundError("Idea not found");

    const user = req.user as IUser;
    const isOwner = idea.owner.toString() === req.userId?.toString();
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin)
      throw new ForbiddenError("You are not authorized to delete this idea");

    await Idea.deleteIdea(req.params.id as string);

    res
      .status(200)
      .json({ success: true, message: "Idea deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteIdea controller", { error });
    next(error);
  }
};
