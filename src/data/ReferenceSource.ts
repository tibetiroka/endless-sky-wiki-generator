/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {getDomainWithProtocol} from "../web_utils.ts";
import {equals} from "../utils.ts";

export class ReferenceSource {
	type: string = '???';
	name: string | null = null;

	constructor(type: string, name: string | null) {
		this.type = type;
		this.name = name;
	}
}

export function isLicense(source: ReferenceSource): boolean {
	return source.type === 'outfit' && (source.name?.endsWith(" License") ?? false);
}

export function getLicenseName(source: ReferenceSource): string {
	return source.name?.substring(0, source.name?.length - " License".length) ?? '';
}

export function isMultiPart(source: ReferenceSource): boolean {
	return source.type.includes('\\');
}

export function getParts(source: ReferenceSource): string[] {
	if (isMultiPart(source)) {
		return [source.type.substring(0, source.type.indexOf('\\')), source.type.substring(source.type.indexOf('\\') + 1)]
	} else {
		return [source.type, source.name as string];
	}
}

export function typeToString(source: ReferenceSource): string {
	if(isMultiPart(source)) {
		const parts = getParts(source);
		const validParts = ['series', 'bay type'];
		if(parts[0] === 'category' && validParts.includes(parts[1])) {
			return parts[1];
		}
		return parts[1] + ' ' + parts[0];
	}
	return source.type;
}

export function toURL(source: ReferenceSource): URL {
	if (source.name === null) {
		return new URL(source.type, getDomainWithProtocol());
	} else {
		return new URL(getDomainWithProtocol().toString() + '/' + encodeURIComponent(source.type) + '/' + encodeURIComponent(source.name));
	}
}

export class IndexEntry {
	key: string = '';
	value: ReferenceSource[] = new Array<ReferenceSource>();
}

export class ReferenceSourceIndex {
	index: IndexEntry[] = new Array<IndexEntry>();

	getIndex(): readonly IndexEntry[] {
		return this.index;
	}

	addEntry(name: string, source: ReferenceSource) {
		for (const entry of this.index) {
			if (entry.key === name) {
				for (let value of entry.value) {
					if (equals(value, source)) {
						return;
					}
				}
				entry.value.push(source);
				return;
			}
		}
		const entry = new IndexEntry();
		entry.key = name;
		entry.value.push(source);
		this.index.push(entry);
	}
}

export type ReferenceData = { [key: string]: ReferenceSource[] };