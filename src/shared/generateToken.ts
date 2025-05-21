import jwt from 'jsonwebtoken';

export const generateAccessToken = (id: string): string => {
    const secreteKey: string = process.env.SECRET_ACCESS_TOKEN_KEY!;

    return jwt.sign({ id }, secreteKey, { expiresIn: '1d' });
};

export const generateRefreshToken = (id: string): string => {
    const secreteKey: string = process.env.SECRET_REFRESH_TOKEN_KEY!;

    return jwt.sign({ id }, secreteKey, { expiresIn: '15d' });
};
