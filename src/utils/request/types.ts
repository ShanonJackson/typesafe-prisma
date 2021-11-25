import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

export interface SecureRequest {
	<R, BODY, QUERY>(
		f: (
			req: NextApiRequest & { user: unknown; client: PrismaClient },
			res: NextApiResponse,
			body: BODY,
			query: QUERY,
		) => Promise<R>,
	): (
		req: NextApiRequest & { user: unknown; client: PrismaClient },
		res: NextApiResponse,
		body: BODY,
		QUERY: QUERY,
	) => Promise<
		Exclude<
			R,
			| ReturnType<typeof BadRequest>
			| typeof NoContent
			| ReturnType<typeof MethodNotAllowed>
			| typeof InternalServerError
			| ReturnType<typeof Unauthorized>
		>
	>;
	<
		REST extends Record<
			string,
			(
				req: NextApiRequest & { user: unknown; client: PrismaClient },
				res: NextApiResponse,
				body: any,
				query: any,
			) => Promise<unknown>
		>,
	>(
		rest: REST,
	): REST;
}

export interface InsecureRequest {
	<R, BODY, QUERY>(
		f: (
			req: NextApiRequest & { user: never; client: PrismaClient },
			res: NextApiResponse,
			body: BODY,
			query: QUERY,
		) => Promise<R>,
	): (
		req: NextApiRequest & { user: never; client: PrismaClient },
		res: NextApiResponse,
		body: BODY,
		QUERY: QUERY,
	) => Promise<
		Exclude<
			R,
			| ReturnType<typeof BadRequest>
			| typeof NoContent
			| ReturnType<typeof MethodNotAllowed>
			| typeof InternalServerError
			| ReturnType<typeof Unauthorized>
			>
		>;
	<
		REST extends Record<
			string,
			(
				req: NextApiRequest & { user: unknown; client: PrismaClient },
				res: NextApiResponse,
				body: any,
				query: any,
			) => Promise<unknown>
			>,
		>(
		rest: REST,
	): REST;
}

export enum EHttpStatusCode {
	Forbidden = 403,
	Success = 200,
	NoContent = 204,
	SeeOther = 303,
	BadRequest = 400,
	Unauthorized = 401,
	NotFound = 404,
	MethodNotAllowed = 405,
	InternalServerError = 500,
	TooManyRequests = 429,
	RequestTimeOut = 408,
	Found = 302,
	BadGateway = 502,
}

export const HttpStatus = Symbol("HttpStatus");
export const BadRequest = (message: string) => ({ message, [HttpStatus]: EHttpStatusCode.BadRequest });
export const Unauthorized = (message?: string) => ({ message, [HttpStatus]: EHttpStatusCode.Unauthorized });
export const NoContent = { [HttpStatus]: EHttpStatusCode.NoContent };
export const MethodNotAllowed = (message: string) => ({ message, [HttpStatus]: EHttpStatusCode.MethodNotAllowed });
export const InternalServerError = { [HttpStatus]: EHttpStatusCode.InternalServerError };
