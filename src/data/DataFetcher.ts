import {ObjectData} from "./ObjectData";
import {encodeSourceName, getParts, ReferenceData, ReferenceSource} from "./ReferenceSource.ts";
import {fetchData} from "../web_utils.ts";
import {ChangeData} from "./ChangeData.ts";
import {findSource} from "../utils.ts";
import {GameFileList} from "./GameFileList.ts";
import {GameObject} from "./DataScheme.tsx";
import untar from "js-untar";

const ES_DATA_ROOT: string = "https://raw.githubusercontent.com/endless-sky/endless-sky/";
const ES_HISTORY_ROOT: string = "https://github.com/endless-sky/endless-sky/commit/";
const ES_INTERACTIVE_ROOT: string = "https://github.com/endless-sky/endless-sky/blob/";
const ES_DEFAULT_REF: string = "refs/heads/master";
const ES_DEFAULT_INTERACTIVE_REF: string = "master";

const DATA_CACHE = new Map<ReferenceSource, Promise<ObjectData>>();
const PARSED_DATA_CACHE = new Map<ReferenceSource, Promise<GameObject>>();
const CHANGELOG_CACHE = new Map<ReferenceSource, Promise<ChangeData[]>>();
const ALL_DATA_CACHE = new Map<string, Promise<Map<string, GameObject>>>();

type DisplayNameData = { [U: string]: ReferenceSource[] };
let DISPLAY_NAME_CACHE: Promise<DisplayNameData> =
	fetchData('index/entries/display name', 1000 * 60 * 60 * 24)
		.then(json => JSON.parse(json) as DisplayNameData);
let FILE_LIST_CACHE: Promise<GameFileList> =
	fetchData('data/files.json', 1000 * 60 * 60 * 24)
		.then(json => JSON.parse(json) as string[])
		.then(array => new GameFileList(array));

export function getData(source: ReferenceSource): Promise<ObjectData> {
	// example: <ROOT>/data/ship/data/Argosy
	const cacheKey: ReferenceSource | null = findSource(source, DATA_CACHE.keys());
	if (cacheKey) {
		// data is cached
		return DATA_CACHE.get(cacheKey) as Promise<ObjectData>;
	}
	const promise: Promise<ObjectData> = fetchData('data/' + getParts(source)[0] + '/data/' + encodeSourceName(getParts(source)[1]))
		.then(json => JSON.parse(json))
		.then(json => {
			const data: ObjectData = new ObjectData(source, json);
			return Promise.resolve(data);
		});
	DATA_CACHE.set(source, promise);
	return promise;
}

export function getIndex(type: string): Promise<string[]> {
	return fetchData('index/entries/' + type, 1000 * 60 * 60 * 24)
		.then(json => JSON.parse(json))
		.then(data => Object.keys(data))
}

export function getParsedData(source: ReferenceSource): Promise<GameObject> {
	const cacheKey: ReferenceSource | null = findSource(source, PARSED_DATA_CACHE.keys());
	if (cacheKey) {
		// data is cached
		return PARSED_DATA_CACHE.get(cacheKey) as Promise<GameObject>;
	}
	const promise: Promise<GameObject> = getData(source).then(data => data.parse());
	PARSED_DATA_CACHE.set(source, promise);
	return promise;
}

export function getChangelog(source: ReferenceSource): Promise<ChangeData[]> {
	// example: <ROOT>/data/ship/changelog/Argosy
	const cacheKey: ReferenceSource | null = findSource(source, CHANGELOG_CACHE.keys());
	if (cacheKey) {
		// data is cached
		return CHANGELOG_CACHE.get(cacheKey) as Promise<ChangeData[]>;
	}
	const promise: Promise<ChangeData[]> = fetchData('data/' + getParts(source)[0] + '/changelog/' + encodeSourceName(getParts(source)[1]))
		.then(json => JSON.parse(json))
		.then(json => {
			const changelog = json as ChangeData[];
			return Promise.resolve(changelog);
		});
	CHANGELOG_CACHE.set(source, promise);
	return promise;
}

export function getDisplayName(source: ReferenceSource): Promise<string> {
	return DISPLAY_NAME_CACHE.then(cache => {
		for (const [key, value] of Object.entries(cache)) {
			if (findSource(source, value) !== null) {
				return Promise.resolve(key);
			}
		}
		return Promise.reject("No display name found for " + source.type + "/" + source.name);
	});
}

export function getReferences(category: string): Promise<ReferenceData> {
	return fetchData('index/references/' + category, 1000 * 60 * 60 * 24)
		.then(value => JSON.parse(value) as ReferenceData);
}

export function getFileList(): Promise<GameFileList> {
	return FILE_LIST_CACHE;
}

export function getAllData(type: string, allowRemoved: boolean = false): Promise<Map<string, GameObject>> {
	if (ALL_DATA_CACHE.has(type)) {
		return ALL_DATA_CACHE.get(type) as Promise<Map<string, GameObject>>;
	}
	const promise: Promise<Map<string, GameObject>> = fetchData('data/' + type + '/all', 0)
		.then(data => {
			const sourceBuffer: ArrayBuffer = new TextEncoder().encode(data).buffer;
			return untar(sourceBuffer);
		})
		.then(files => files.map(file => new ObjectData(new ReferenceSource(type, file.name), file.readAsJSON()))
			.filter(data => allowRemoved || !data.isRemoved())
			.map(data => data.parse()))
		.then(data => {
			const map = new Map<string, GameObject>();
			data.forEach(datum => map.set(datum.name, datum));
			return map;
		});
	ALL_DATA_CACHE.set(type, promise);
	return promise;
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