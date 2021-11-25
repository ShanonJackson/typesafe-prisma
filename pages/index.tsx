import * as React from "react";
import {useState} from "react";
import {useApi} from "@/hooks/use-api";

export default function Page() {
    /* type-safe data here */
    const {data, loading, update} = useApi.get<typeof import("/api/posts")>("/api/posts");
    const {update: insert} = useApi.post<typeof import("/api/posts")>("/api/posts");
    const [text, setText] = useState("");
    return (
        <div>
            <input value={text} onChange={(e) => setText(e.target.value)}/>
            <button onClick={async () => {
                await insert({body: {title: text}}) /* typesafe body here */
                setText("");
                update();
            }}>
                Create post
            </button>
            <div>
                <div>YOUR POSTS ARE:</div>
                {data?.map((post) => {
                    return (
                        <div key={post.id}>
                            <h6>{post.title}</h6>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}