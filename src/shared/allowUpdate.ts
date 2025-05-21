import { Request } from 'express';

const allowedUpdate = (req: Request, data: string[]) => {
    const updateData: Record<string, any> = {};

    // Pick only allowed fields from req.body
    for (const key of data) {
        if (req.body[key] !== undefined) {
            updateData[key] = req.body[key];
        }
    }

    return updateData;
};

export default allowedUpdate;
