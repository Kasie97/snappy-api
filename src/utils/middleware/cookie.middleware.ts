import { Request, Response, NextFunction } from 'express';
import { parseCookies } from 'src/utils/cookies.utils';

export function cookieMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const cookieHeader = req.headers.cookie;
  req.cookies = parseCookies(cookieHeader);
  next();
}
