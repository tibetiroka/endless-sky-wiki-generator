import {ObjectData} from "./ObjectData";
import {ReferenceData, ReferenceSource} from "./ReferenceSource.ts";
import {fetchData} from "../web_utils.ts";
import {ChangeData} from "./ChangeData.tsx";
import {findSource} from "../utils.ts";

const ES_DATA_ROOT: string = "https://raw.githubusercontent.com/endless-sky/endless-sky/";
const ES_HISTORY_ROOT: string = "https://github.com/endless-sky/endless-sky/commit/";
const ES_INTERACTIVE_ROOT: string = "https://github.com/endless-sky/endless-sky/blob/";
const ES_DEFAULT_REF: string = "refs/heads/master";
const ES_DEFAULT_INTERACTIVE_REF: string = "master";

const DATA_CACHE = new Map<ReferenceSource, Promise<ObjectData>>();
const CHANGELOG_CACHE = new Map<ReferenceSource, Promise<ChangeData[]>>();

export function getData(source: ReferenceSource): Promise<ObjectData> {
	// example: <ROOT>/data/ship/data/Argosy
	const cacheKey: ReferenceSource | null = findSource(source, DATA_CACHE.keys());
	if (cacheKey) {
		// data is cached
		return DATA_CACHE.get(cacheKey) as Promise<ObjectData>;
	}
	const promise: Promise<ObjectData> = fetchData('data/' + source.type + '/data/' + source.name)
		.then(json => JSON.parse(json))
		.then(json => {
			const data: ObjectData = new ObjectData(source, json);
			return Promise.resolve(data);
		});
	DATA_CACHE.set(source, promise);
	return promise;
}

export function getChangelog(source: ReferenceSource): Promise<ChangeData[]> {
	// example: <ROOT>/data/ship/changelog/Argosy
	const cacheKey: ReferenceSource | null = findSource(source, CHANGELOG_CACHE.keys());
	if (cacheKey) {
		// data is cached
		return CHANGELOG_CACHE.get(cacheKey) as Promise<ChangeData[]>;
	}
	const promise: Promise<ChangeData[]> = fetchData('data/' + source.type + '/changelog/' + source.name)
		.then(json => JSON.parse(json))
		.then(json => {
			const changelog = json as ChangeData[];
			return Promise.resolve(changelog);
		});
	CHANGELOG_CACHE.set(source, promise);
	return promise;
}

export function getReferences(category: string): Promise<ReferenceData> {
	return fetchData('index/references/' + category, 1000 * 60 * 60 * 24)
		.then(value => JSON.parse(value) as ReferenceData);
}

export function getEsUrl(path: string, ref: string = ES_DEFAULT_REF): URL {
	// example: <ROOT>/refs/heads/master/images/map/a-star+.png
	return new URL(ES_DATA_ROOT + ref + "/" + path);
}

export function getCommitURL(hash: string): URL {
	// example: <ROOT>/8d64494c9cb3d6c6781e8961321fd10a1e5d7159
	return new URL(ES_HISTORY_ROOT + hash);
}

export function getInteractiveFileURL(path: string, line: number, ref: string | undefined = undefined): URL {
	if (!ref) {
		ref = ES_DEFAULT_INTERACTIVE_REF;
	}
	// example: <ROOT>/master/data/_deprecated/deprecated outfits.txt#L8
	return new URL(ES_INTERACTIVE_ROOT + ref + "/data/" + path + "#L" + line.toString());
}