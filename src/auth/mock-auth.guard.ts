import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { Types } from 'mongoose';
import crypto from 'crypto';

const MOCK_COOKIE_NAME = 'mock-user-id';
const HMAC_SECRET = process.env.MOCK_HMAC_SECRET || 'dev-secret-change-me';

function deterministicObjectIdFromString(input: string): string {
  const h = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(input)
    .digest('hex');
  return h.slice(0, 24);
}

@Injectable()
export class MockAuthGuard implements CanActivate {
  private readonly logger = new Logger(MockAuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = GqlExecutionContext.create(context);
    type HeaderMap = { [key: string]: string | string[] | undefined };
    type CookieMap = { [key: string]: string | undefined };

    const gqlCtx = ctx.getContext<{
      req?: Request & { user?: any; headers?: HeaderMap; cookies?: CookieMap };
      res?: Response;
    }>();

    const response = gqlCtx.res;

    type GqlCtxWithConnection = {
      connection?: {
        context?: {
          req?: Request & {
            user?: any;
            headers?: HeaderMap;
            cookies?: CookieMap;
          };
        };
      };
    };

    const connectionReq = (gqlCtx as GqlCtxWithConnection).connection?.context
      ?.req;

    const request =
      gqlCtx.req ??
      (connectionReq as
        | (Request & { user?: any; headers?: HeaderMap; cookies?: CookieMap })
        | undefined) ??
      ({ headers: {}, cookies: {} } as Request & {
        user?: any;
        headers?: HeaderMap;
        cookies?: CookieMap;
      });

    const rawUserId = (() => {
      const headers = request.headers as HeaderMap | undefined;
      const h = headers?.['x-user-id'];
      if (typeof h === 'string' && h) return h;
      const cookies = request.cookies as CookieMap | undefined;
      if (cookies && typeof cookies[MOCK_COOKIE_NAME] === 'string') {
        return cookies[MOCK_COOKIE_NAME];
      }
      const rawUsername = headers?.['x-username'];
      if (typeof rawUsername === 'string' && rawUsername.trim().length > 0) {
        return deterministicObjectIdFromString(rawUsername.trim());
      }
      return undefined;
    })();

    let userId: string;
    if (rawUserId && Types.ObjectId.isValid(String(rawUserId))) {
      userId = String(rawUserId);
    } else if (rawUserId) {
      const maybe = String(rawUserId)
        .replace(/[^a-fA-F0-9]/g, '')
        .slice(0, 24);
      if (Types.ObjectId.isValid(maybe)) {
        userId = maybe;
        this.logger.warn(`Coerced invalid x-user-id into ObjectId: ${userId}`);
      } else {
        userId = new Types.ObjectId().toString();
        this.logger.warn(
          `Generated new mock user ID: ${userId} — invalid x-user-id provided.`,
        );
      }
    } else {
      userId = new Types.ObjectId().toString();
      this.logger.warn(
        `Generated new mock user ID: ${userId} — missing x-user-id header/cookie/username.`,
      );
      try {
        if (response && process.env.NODE_ENV !== 'production') {
          response.cookie(MOCK_COOKIE_NAME, userId, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7,
          });
        }
      } catch (err) {
        this.logger.error(
          `Failed to set mock auth cookie: ${(err as Error).message}`,
        );
      }
    }

    const rawUsernameHeader = request?.headers?.['x-username'];
    const username =
      typeof rawUsernameHeader === 'string' ? rawUsernameHeader : 'mockuser';

    request.user = {
      id: userId,
      username,
      email: `${username}@example.com`,
    };

    // ensure the context sees the attached request
    gqlCtx.req = request;
    return true;
  }
}
