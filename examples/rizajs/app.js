import { getArguments, getEnvironment } from "wasi:cli/environment@0.2.0";
import { getDirectories } from "wasi:filesystem/preopens@0.2.0";
import { getStdin } from "wasi:cli/stdin@0.2.0";

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

export const run = {
    run: function () {
        const process = {
            argv: getArguments(),
            stdin: _stdin(),
            env: {},
        };

        for (const entry of getEnvironment()) {
            process.env[entry[0]] = entry[1];
        }

        eval(_code());
    },
};
