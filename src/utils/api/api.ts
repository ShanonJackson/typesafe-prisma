import { EHttpStatusCode } from "@/utils/request/types";
import { IncomingMessage } from "http";

export type UnwrapPromise<T> = T extends Promise<infer VALUE> ? VALUE : never;

export type ApiResponse<T extends { default: (req: any, res: any, body: never, query: never) => unknown }> =
	UnwrapPromise<ReturnType<T["default"]>>;

export type ApiRestResponse<
	T extends { default: Record<string, (req: any, res: any, body: never, query: never) => unknown> },
	K extends keyof T["default"],
> = UnwrapPromise<ReturnType<T["default"][K]>>;

export function URL(url: string, query: string, ctx?: { req: IncomingMessage }) {
	const uri = (() => {
		if (url.includes("http")) return url; // full url support.
		if (ctx) {
			// server side support with ctx.
			const host = ctx?.req
				? ctx.req.headers["x-forwarded-host"] || ctx.req.headers["host"]
				: window.location.host;
			const protocol = host && host.includes("localhost") ? "http:" : "https:";
			return protocol + "//" + host;
		}
		return url;
	})();
	return `${uri}${query ? "?" + new URLSearchParams(query).toString() : ""}`;
}

export const api = async <T extends { default: (req: any, res: any, body: never, query: never) => unknown }>(
	url: string,
	{
		query,
		method = "GET",
		headers: optionsHeaders = {},
		body,
		ctx,
	}: {
		method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
		headers?: Record<string, string>;
		query?: Parameters<T["default"]>[3];
		body?: Parameters<T["default"]>[2];
		ctx?: { req: IncomingMessage };
	} = {},
): Promise<ApiResponse<T>> => {
	const cookie = (() => {
		if (ctx) return { Cookie: ctx.req?.headers?.cookie || "", Authorization: ctx.req?.headers?.authorization };
	})();
	const isAdminSection =
		typeof window === "undefined"
			? false
			: window.location.pathname.includes("admin") || window.location.pathname.includes("pmc");
	const headers = (() => {
		const token =
			typeof window === "undefined" ? "" : localStorage.getItem(isAdminSection ? "admin_identity" : "identity");
		if (body) {
			return {
				Accept: "application/json",
				["Content-Type"]: "application/json",
				["x-requested-with"]: "XMLHttpRequest",
				["Authorization"]: "Bearer " + token,
				...cookie,
				...optionsHeaders,
			};
		}

		return {
			["x-requested-with"]: "XMLHttpRequest",
			["Authorization"]: "Bearer " + token,
			...cookie,
			...optionsHeaders,
		};
	})();
	const response = await fetch(URL(url, query as string), {
		headers: headers,
		credentials: "same-origin",
		body: JSON.stringify(body),
		method: method || (body ? "POST" : "GET"),
	});
	if (response.status !== 200) {
		switch (response.status) {
			case EHttpStatusCode.BadGateway:
			case EHttpStatusCode.InternalServerError: {
				throw new Error("Oops, something's gone wrong. Try refreshing the page.");
			}
			case EHttpStatusCode.TooManyRequests: {
				throw new Error("Oops, something has gone wrong. Try again soon.");
			}
			case EHttpStatusCode.RequestTimeOut: {
				throw new Error("Looks like the server is taking too long to respond, please try again soon.");
			}
			case EHttpStatusCode.NotFound: {
				throw new Error("Oops, we can't find what you're looking for.");
			}
			case EHttpStatusCode.BadRequest: {
				const json = await response.json();
				const messages = Array.isArray(json.message) ? json.message.join("MESSAGEBREAK") : json.message;
				throw new Error(messages || "Something has gone wrong, try refreshing the page.");
			}
			case EHttpStatusCode.Unauthorized: {
				throw new Error("Sorry you don't have the permission to preform that action.");
			}
			case EHttpStatusCode.Found:
			case EHttpStatusCode.NoContent:
				return {} as any;
		}
	}
	if (response.headers.get("content-type")?.includes("application/json")) return response.json();
	return response.text() as any;
};

const create =
	<K extends "GET" | "POST" | "PUT" | "PATCH" | "DELETE">(method: K) =>
	<T extends { default: Record<K, (req: any, res: any, body: never, query: never) => unknown> }>(
		url: string,
		options: {
			headers?: Record<string, string>;
			query?: Parameters<T["default"][K]>[3];
			body?: Parameters<T["default"][K]>[2];
			ctx?: { req: IncomingMessage };
		} = {},
	): Promise<ApiRestResponse<T, K>> => {
		return api<{ default: T["default"][K] }>(url, { ...options, method: method });
	};
api.get = create("GET");
api.post = create("POST");
api.put = create("PUT");
api.delete = create("DELETE");
