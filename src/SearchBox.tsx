/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {SetStateAction, useEffect, useState} from "react";
import {IndexEntry, ReferenceSource, ReferenceSourceIndex} from "./data/ReferenceSource.ts";
import Fuse from "fuse.js";
import {fetchData} from "./utils.ts";

export const CUSTOM_PAGES: ReferenceSourceIndex = new ReferenceSourceIndex();

export const SearchBox = () => {
    const [filteredSuggestions, setFilteredSuggestions] = useState(new Array<IndexEntry>());
    const [inputValue, setInputValue] = useState('');
    const [data, setData] = useState(CUSTOM_PAGES);

    useEffect(() => {
        async function refreshIndex() {
            return fetchData('index/entries/everything').then(text => {
                return JSON.parse(text);
            }).then(parsed => {
                const dataClone: ReferenceSourceIndex = structuredClone(data);
                const keys: string[] = Object.keys(parsed);
                for (let key of keys) {
                    const references: Array<ReferenceSource> = parsed[key];
                    for (let reference of references) {
                        dataClone.addEntry(key, reference);
                    }
                }
                setData(dataClone);
            });
        }

        refreshIndex();
    }, [data])

    const handleChange = (event: { target: { value: any; }; }) => {
        const inputValue = event.target.value;
        setInputValue(inputValue);

        // Filter suggestions based on input value
        const fuse = new Fuse(data.getIndex(), {keys: ['key']});
        const filtered = fuse.search(inputValue).map(result => result.item);
        setFilteredSuggestions(filtered);
    };

    const handleSelect = (value: SetStateAction<ReferenceSource>) => {
        //todo: navigate to page
    };

    return (
        <div className="autocomplete-container">
            <input
                className="autocomplete-input"
                type="text"
                value={inputValue}
                onChange={handleChange}
                placeholder="Search..."
            />
            <ul className="autocomplete-suggestions">
                {
                    new Set(filteredSuggestions.flatMap(suggestion => {
                        return suggestion.value.map(source => {
                            return {key: suggestion.key, value: source, duplicate: suggestion.value.length > 1};
                        });
                    })).keys().toArray().map((source, index) => {
                        return <li key={index} className="autocomplete-suggestion" onClick={() => handleSelect(source.value)}>
                            {source.key + source.duplicate ? ' (' + source.value.type + ')' : ''}
                        </li>;
                    })
                }
            </ul>
        </div>
    );
};