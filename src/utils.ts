/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReferenceSource} from "./data/ReferenceSource.ts";

export function equals(a: ReferenceSource, b: ReferenceSource): boolean {
	return a.type === b.type && a.name === b.name;
}

export function findSource(source: ReferenceSource, collection: any): ReferenceSource | null {
	for (const element of collection) {
		if (equals(source, element)) {
			return element;
		}
	}
	return null;
}