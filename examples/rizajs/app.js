import { getArguments, getEnvironment } from "wasi:cli/environment@0.2.0";
import { getDirectories } from "wasi:filesystem/preopens@0.2.0";
import { getStdin } from "wasi:cli/stdin@0.2.0";

import { handle } from "wasi:http/outgoing-handler@0.2.0";
import { OutgoingRequest, OutgoingBody, Fields, } from "wasi:http/types@0.2.0";

/*
from command_extended.imports.wasi_http_types import (
    Scheme, Scheme_Http, Scheme_Https, Scheme_Other,
    Method_Get, Method_Head, Method_Post, Method_Put, Method_Delete,
    Method_Connect, Method_Options, Method_Trace, Method_Patch, Method_Other,
    Fields, OutgoingRequest, OutgoingBody
)

from .poll_loop import (
    Stream,
    Sink,
    PollLoop,
    send,
)

from .._models import Request, Response
from .base import AsyncBaseTransport, BaseTransport


class WASITransport(AsyncBaseTransport, BaseTransport):
    def __init__(self, **kwargs) -> None:
        self.loop = PollLoop()

    def handle_request(
        self,
        request: Request,
    ) -> Response:
        t = self.loop.create_task(_handle_request(self.loop, request))
        response = self.loop.run_until_complete(t)
        response.request = request
        response.connection = self
        return response

    async def handle_async_request(
        self,
        request: Request,
    ) -> Response:
        raise ValueError("unimplemented")


async def _handle_request(loop, req) -> Response:
    """Download the contents of the specified URL, computing the SHA-256
    incrementally as the response body arrives.

    This returns a tuple of the original URL and either the hex-encoded hash or
    an error message.
    """
    match req.url.scheme:
        case "http":
            scheme: Scheme = Scheme_Http()
        case "https":
            scheme = Scheme_Https()
        case _:
            scheme = Scheme_Other(req.url.scheme)

    # TODO: Why can't I send the Connection header?
    # TODO: Re-enable gzip
    forbidden = {
        "accept-encoding",
        "connection",
        "host",
    }
    fields = [(k, bytes(v, 'utf-8')) for k, v in req.headers.items() if k not in forbidden]

    request = OutgoingRequest(Fields.from_list(fields))
    request.set_scheme(scheme)
    request.set_authority(req.url.netloc.decode('utf-8'))
    request.set_path_with_query(req.url.raw_path.decode('utf-8'))

    match req.method:
        case "GET":
            request.set_method(Method_Get())
        case "HEAD":
            request.set_method(Method_Head())
        case "POST":
            request.set_method(Method_Post())
        case "PUT":
            request.set_method(Method_Put())
        case "DELETE":
            request.set_method(Method_Delete())
        case "CONNECT":
            request.set_method(Method_Connect())
        case "OPTIONS":
            request.set_method(Method_Options())
        case "TRACE":
            request.set_method(Method_Trace())
        case "PATCH":
            request.set_method(Method_Patch())
        case _:
            request.set_method(Method_Other(value=req.method))
    
    if req.stream is not None:
        body = request.body()
        sink = Sink(loop, body)

        blob = b""
        for chunk in req.stream:
            # TODO: Slow at larger scales
            blob += chunk

        await sink.send(blob)
        sink.close()

    response = await send(loop, request)
    status = response.status()

    blob = b""
    stream = Stream(loop, response.consume())
    while True:
        chunk = await stream.next()
        if chunk is None:
            break
        else:
            # TODO: Slow at larger scales
            blob += chunk

    headers = response.headers().entries()
    resp = Response(
        status,
        headers=headers,
        content=blob,
    )

    # Set encoding.
    # resp.encoding = get_encoding_from_headers(resp.headers)

    # resp.url = url

    # TODO: Add new cookies from the server.
    # extract_cookies_to_jar(response.cookies, req, resp)

    return resp
*/

// Declaration
class Response {
    // Always a String
    #body;
    #status;
    #statusText;
    #headers;

    constructor(body, options) {
        this.#body = body;
        this.#status = options.status;
        this.#statusText = options.statusText;
        this.#headers = options.headers;
    }

    // TODO: This should be a ReadableStream, not a string
    get body() {
        return this.#body;
    }

    get headers() {
        return this.#headers;
    }

    get ok() {
        return this.#status >= 200 && this.#status <= 299;
    }

    get status() {
        return this.#status;
    }

    get statusText() {
        return this.#statusText;
    }

    get type() {
        return 'basic';
    }

    clone() {
        return structuredClone(this);
    }

    async text() {
        return this.#body;
    }

    async json() {
        return JSON.parse(this.#body);
    }

    async formData() {
        throw new Error("unimplemented");
    }

    async blob() {
        throw new Error("unimplemented");
    }

    async arrayBuffer() {
        throw new Error("unimplemented");
    }
}


function _stdin() {
    const handle = getStdin();
    try {
        handle.blockingRead(0);
    } catch (e) {
        if (e.payload && e.payload.tag === "closed") {
            return "";
        }
        throw e;
    }
    const bytes = handle.blockingRead(1024 * 1024 * 10);
    const contents = new TextDecoder().decode(bytes);
    return contents;
}

function _code() {
    const po = getDirectories();
    const src = po[0];
    const dir = src[0];
    const fd = dir.openAt(null, "code.js", null, null);
    const result = fd.read(10000000, 0);
    const contents = new TextDecoder().decode(result[0]);
    return contents;
}

async function _fetch(resource, options) {
    const url = new URL(resource);
    // const request = new Request(resource, options);
    // console.log(request);

    if (!options) {
        options = {};
    }

    const requestHeaders = new Headers(options.headers || {});
    const outgoingHeaders = [];
    for (const entry of requestHeaders.entries()) {
        // TODO: Skip forbidden headers
        const encoder = new TextEncoder();
        outgoingHeaders.push([entry[0], encoder.encode(entry[1])]);
    }
    const outgoing = new OutgoingRequest(Fields.fromList(outgoingHeaders));

    switch (url.protocol) {
        case "https:":
            outgoing.setScheme({tag: 'HTTPS'});
            break;
        case "http:":
            outgoing.setScheme({tag: 'HTTP'});
            break;
        default:
            console.log(`unknown protocol: ${url.protocol}`);
            break;
    }

    switch ((options.method || "GET").toUpperCase()) {
        case "GET":
            outgoing.setMethod({tag: "get"});
            break;
        case "HEAD":
            outgoing.setMethod({tag: "head"});
            break;
        case "POST":
            outgoing.setMethod({tag: "post"});
            break;
        case "PUT":
            outgoing.setMethod({tag: "put"});
            break;
        case "DELETE":
            outgoing.setMethod({tag: "delete"});
            break;
        case "CONNECT":
            outgoing.setMethod({tag: "connect"});
            break;
        case "OPTIONS":
            outgoing.setMethod({tag: "options"});
            break;
        case "TRACE":
            outgoing.setMethod({tag: "trace"});
            break;
        case "PATCH":
            outgoing.setMethod({tag: "patch"});
            break;
        default:
            console.log(`unknown method: ${options.method}`);
            // TODO: Support arbritrary methods
            break;
    }

    let userinfo = "";
    if (url.username || url.password ) {
        userinfo = `${url.username}:${url.password}@`
    }

    outgoing.setAuthority(`${userinfo}${url.host}`);
    outgoing.setPathWithQuery(`${url.pathname}${url.search}`);

    if (options.body) {
        const body = outgoing.body();
        const stream = body.write();
        const encoder = new TextEncoder();

        // TODO: Handle case when this isn't a string
        const contents = new Uint8Array(encoder.encode(options.body));
        stream.blockingWriteAndFlush(contents);
        stream[Symbol.dispose]();

        // Finish response
        OutgoingBody.finish(body, undefined);
    }

    try {
        const future = handle(outgoing, null);

        // Wait for the request to finish
        // TODO: Use setTimeout and use a promise?
        const respPollable = future.subscribe();
        respPollable.block();

        // Get the response
        const wrapped = future.get();
        const incoming = wrapped.val.val;

        const body = incoming.consume();
        const stream = body.stream();

        // TODO: Use setTimeout and use a promise?
        const bodyPollable = stream.subscribe();
        bodyPollable.block();

        let contentLength = 10000000; // Maximum allowed content size?
        const headers = new Headers();
        for (const entry of incoming.headers().entries()) {
            const decoder = new TextDecoder();
            const value = decoder.decode(entry[1]);
            if (entry[0].toLowerCase() === "content-length") {
                contentLength = parseInt(value, 10);
            }
            headers.append(entry[0], value);
        }

        // TODO: Track how many bytes were actually read
        const bytes = stream.read(contentLength);
        const str = new TextDecoder().decode(bytes);
            
        const resp = new Response(new String(str), {
            status: incoming.status(),
            headers: headers,
        });

        return resp;

    } catch (e) {
        console.log(`Response error: ${JSON.stringify(e)}`);
        throw e;
    }
}

export const run = {
    run: async function () {
        const process = {
            argv: getArguments(),
            stdin: _stdin(),
            env: {},
        };

        const fetch = _fetch;

        for (const entry of getEnvironment()) {
            process.env[entry[0]] = entry[1];
        }

        eval(_code());
    },
};
