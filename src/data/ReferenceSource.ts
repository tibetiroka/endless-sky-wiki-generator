/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {getDomainWithProtocol} from "../utils.ts";

export class ReferenceSource {
    type: string = '???';
    name: string | null = null;

    toURL(): URL {
        if (this.name === null) {
            return new URL(this.type, getDomainWithProtocol());
        } else {
            return new URL(this.name, new URL(this.type, getDomainWithProtocol()));
        }
    }
}

export class IndexEntry {
    key: string = '';
    value: ReferenceSource[] = new Array<ReferenceSource>();
}

export class ReferenceSourceIndex {
    private index: IndexEntry[] = new Array<IndexEntry>();

    getIndex(): readonly IndexEntry[] {
        return this.index;
    }

    addEntry(name: string, source: ReferenceSource) {
        for (let entry of this.index) {
            if (entry.key === name) {
                for (let value of entry.value) {
                    if (value === source) {
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