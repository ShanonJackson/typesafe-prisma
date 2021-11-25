import {insecure} from "@/utils/request/request";


export default insecure({
    GET: async (req) => req.client.post.findMany(),
    POST: async (req, res, body: {title: string}) => {
        // error handling examples don't effect type safety.
        // if(Math.random() > 0.8) return BadRequest("Invalid post name")
        // if(Math.random() > 0.9) return InternalServerError;
        return req.client.post.create({data: {title: body.title}})
    }
})