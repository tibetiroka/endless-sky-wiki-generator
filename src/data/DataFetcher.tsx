import {ObjectData} from "./ObjectData";

const WIKI_DATA_ROOT: string = window.location.host + "/es-wiki-diff/";
const ES_DATA_ROOT: string = "https://raw.githubusercontent.com/endless-sky/endless-sky/";
const ES_HISTORY_ROOT: string = "https://github.com/endless-sky/endless-sky/commit/";
const ES_INTERACTIVE_ROOT: string = "https://github.com/endless-sky/endless-sky/blob/";
const ES_DEFAULT_REF: string = "refs/heads/master";
const ES_DEFAULT_INTERACTIVE_REF: string = "master";

async function fetchJSON(url: URL): Promise<Object> {
    return fetch(url)
        .then(response => response.text())
        .then(text => Promise.resolve(JSON.parse(text)));
}

export async function getData(type: string, name: string): Promise<ObjectData> {
    // example: <ROOT>/ship/data/Argosy
    return fetchJSON(new URL(WIKI_DATA_ROOT + type + "/data/" + name))
        .then(json => Promise.resolve(new ObjectData(type, name, json)));
}

export function getEsUrl(path: string, ref: string = ES_DEFAULT_REF): URL {
    // example: <ROOT>/refs/heads/master/images/map/a-star+.png
    return new URL(ES_DATA_ROOT + ref + "/" + path);
}

export function getCommitURL(hash: string): URL {
    // example: <ROOT>/8d64494c9cb3d6c6781e8961321fd10a1e5d7159
    return new URL(ES_HISTORY_ROOT + hash);
}

export function getInteractiveFileURL(path: string, line: number, ref: string = ES_DEFAULT_INTERACTIVE_REF): URL {
    // example: <ROOT>/master/data/_deprecated/deprecated outfits.txt#L8
    return new URL(ES_INTERACTIVE_ROOT + ref + "/" + path + "#L" + line.toString());
}