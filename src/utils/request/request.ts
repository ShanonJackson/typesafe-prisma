import {NextApiRequest, NextApiResponse} from "next";
import {EHttpStatusCode, HttpStatus, InsecureRequest, NoContent, SecureRequest} from "@/utils/request/types";
import {PrismaClient} from "@prisma/client";

export const prisma = globalThis["prisma"] || (globalThis["prisma"] = new PrismaClient({log: ["query"]}));
export const secure: SecureRequest = (f: any /* no assertion here possible */) => {
    return (async (req: NextApiRequest & { user: unknown; client: PrismaClient }, res: NextApiResponse) => {
        if (!req.headers.authorization) return res.status(EHttpStatusCode.Unauthorized).end();
        try {
            /* your security related middleware */
            req.client = prisma;
            try {
                const response = await (() => {
                    if (typeof f === "function") return f(req, res, req.body, req.query as never);
                    return f[req.method?.toUpperCase() || "GET"](req, res, req.body, req.query as never);
                })();
                return handler(req, res)(response);
            } catch (e) {
                const error = e as Error;
                console.log(error.message);
                return res.status(EHttpStatusCode.InternalServerError).end();
            }
        } catch (e) {
            return res.status(EHttpStatusCode.Forbidden).end();
        }
    }) as never;
}

export const insecure: InsecureRequest = (f: any) => {
    return (async (req: NextApiRequest & { user: unknown; client: PrismaClient }, res: NextApiResponse) => {
        req.client = prisma;
        const response = await (() => {
            if (typeof f === "function") return f(req, res, req.body, req.query as never);
            return f[req.method?.toUpperCase() || "GET"](req, res, req.body, req.query as never);
        })();
        return handler(req, res)(response);
    }) as never;
}


const handler = (req: NextApiRequest, res: NextApiResponse) => (response: unknown | typeof NoContent) => {
    if (!response) return res.status(res.statusCode || EHttpStatusCode.NoContent).end();
    switch ((response as any)[HttpStatus]) {
        case EHttpStatusCode.BadRequest: {
            return res.status(EHttpStatusCode.BadRequest).send({message: (response as { message: string }).message});
        }
        case EHttpStatusCode.Unauthorized: {
            const isMessage = (response: any): response is { message: string } => {
                return response && typeof response === "object" && "message" in response;
            };
            return res.status(EHttpStatusCode.Unauthorized).send(isMessage(response) ? response : "Unauthorized");
        }
        case EHttpStatusCode.MethodNotAllowed: {
            return res.status(EHttpStatusCode.MethodNotAllowed).send({
                error: {
                    code: EHttpStatusCode.MethodNotAllowed,
                    message: (response as { message: string }).message,
                },
            });
        }
        case EHttpStatusCode.NoContent: {
            return res.status(EHttpStatusCode.NoContent).end();
        }
        case EHttpStatusCode.InternalServerError: {
            return res.status(EHttpStatusCode.InternalServerError).end();
        }
    }
    return res.send(response);
};
