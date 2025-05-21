import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import message from './message';

const validateParamsMongoId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: message.pleaseProvideAnIncorrectId });

    return;
  }

  next();
};

export default validateParamsMongoId;
