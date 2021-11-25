import type { IncomingMessage } from "http";
import { useEffect, useState } from "react";
import { api, ApiResponse, ApiRestResponse } from "@/utils/api/api";

export const useApi = <T extends { default: (req: any, res: any, body: never, query: never) => unknown }>(
	url: string,
	options: {
		pause?: boolean;
		method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
		query?: Parameters<T["default"]>[3];
		headers?: Record<string, string>;
		body?: Parameters<T["default"]>[2];
		ctx?: { req: IncomingMessage };
	} = {},
): {
	data?: ApiResponse<T>;
	loading: boolean;
	refetch: (opts?: Omit<typeof options, "method">) => Promise<ApiResponse<T> | void>;
} => {
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<ApiResponse<T> | undefined>();
	const get = (opts?: Omit<typeof options, "method">) => {
		setLoading(true);
		return api<T>(url, opts ? { ...opts, method: options.method } : options)
			.then((d) => {
				setData(d);
				return d;
			})
			.catch((e: Error) => {
				/* your error handling */
			})
			.finally(() => setLoading(false));
	};
	useEffect(() => {
		if (!options.pause) get(options);
	}, [options.pause]);
	return { data, loading, refetch: get };
};

const create =
	<K extends "GET" | "PUT" | "PATCH" | "POST" | "DELETE">(method: K) =>
	<T extends { default: Record<K, (req: any, res: any, body: never, query: never) => unknown> }>(
		url: string,
		options: {
			query?: Parameters<T["default"][K]>[3];
			headers?: Record<string, string>;
			body?: Parameters<T["default"][K]>[2];
			ctx?: { req: IncomingMessage };
		} = {},
	): {
		data?: ApiRestResponse<T, K>;
		loading: boolean;
		update: (opts?: Omit<typeof options, "method">) => Promise<ApiResponse<{ default: T["default"][K] }> | void>;
	} => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const { data, loading, refetch } = useApi<{ default: T["default"][K] }>(url, {
			...options,
			method,
			pause: method !== "GET",
		});
		return { data, loading, update: refetch };
	};
useApi.patch = create("PATCH");
useApi.get = create("GET");
useApi.post = create("POST");
useApi.put = create("PUT");
useApi.delete = create("DELETE");
