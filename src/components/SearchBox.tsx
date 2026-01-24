/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {useEffect, useState} from "react";
import {IndexEntry, ReferenceSource, ReferenceSourceIndex, toURL, typeToString} from "../data/ReferenceSource.ts";
import Fuse from "fuse.js";
import {fetchData} from "../web_utils.ts";
import {equals} from "../utils.ts";

export const CUSTOM_PAGES: ReferenceSourceIndex = new ReferenceSourceIndex();

function filterIndex(index: readonly IndexEntry[]): IndexEntry[] {
	function isUnsupported(source: ReferenceSource): boolean {
		const unsupported = ['license', 'landable', 'star', 'landing message', 'swizzle', 'galaxy', 'hazard', 'effect', 'wormhole', 'color'];
		return unsupported.includes(source.type);
	}

	return index
		.map(entry => {
			if (entry.value.some(isUnsupported)) {
				const newEntry = new IndexEntry();
				newEntry.key = entry.key;
				newEntry.value = entry.value.filter(v => !isUnsupported(v));
				return newEntry;
			} else {
				return entry;
			}
		})
		.filter(entry => entry.value.length > 0);
}

export const SearchBox = () => {
	const [filteredSuggestions, setFilteredSuggestions] = useState(new Array<IndexEntry>());
	const [inputValue, setInputValue] = useState('');
	const [data, setData] = useState(CUSTOM_PAGES);

	useEffect(() => {
		async function refreshIndex() {
			return fetchData('index/entries/everything', 1000 * 60 * 60 * 24).then(text => {
				return JSON.parse(text);
			}).then(parsed => {
				const keys: string[] = Object.keys(parsed);
				for (const key of keys) {
					const references: Array<ReferenceSource> = parsed[key];
					for (const reference of references) {
						data.addEntry(key, reference);
					}
				}
				setData(data);
			});
		}

		refreshIndex();
	}, [data])

	const handleChange = (event: { target: { value: any; }; }) => {
		const inputValue = event.target.value;
		setInputValue(inputValue);

		// Filter suggestions based on input value
		const fuse = new Fuse(filterIndex(data.getIndex()), {
			keys: ['key'],
			threshold: 0.1,
			ignoreDiacritics: true,
			ignoreLocation: false,
			distance: 1000,
			location: 0,
			findAllMatches: true,
			includeScore: true,
			shouldSort: true,
			useExtendedSearch: true,
			ignoreFieldNorm: true
		});
		const filtered = fuse.search(inputValue).map(result => result.item);
		setFilteredSuggestions(filtered);
	};

	const handleSelect = (value: ReferenceSource) => {
		window.location.href = toURL(value).toString();
	};

	return (
		<div className="autocomplete-container">
			<input
				className="autocomplete-input"
				type="text"
				value={inputValue}
				onChange={handleChange}
				onKeyDown={key => {
					if (key.key === 'Escape') {
						(key.target as any).value = '';
						handleChange(key as any);
						key.preventDefault();
					} else if (key.key === 'ArrowDown') {
						const firstSuggestion: any = document.getElementsByClassName("autocomplete-suggestion").item(0);
						if (firstSuggestion !== null) {
							firstSuggestion.focus();
						}
						key.preventDefault();
					}
				}}
				placeholder="Search..."
			/>
			<ul className="autocomplete-suggestions">
				{generateSuggestions(filteredSuggestions, handleSelect, handleChange)}
			</ul>
		</div>
	);
};

class SuggestionEntry {
	key: string;
	value: ReferenceSource;
	duplicate: string | null;

	constructor(key: string, value: ReferenceSource, duplicate: string | null) {
		this.key = key;
		this.value = value;
		this.duplicate = duplicate;
	}
}

type SelectorCallback = (source: ReferenceSource) => any;
type InputCallback = (event: { target: { value: any; } }) => any;

function generateSuggestions(suggestions: Array<IndexEntry>, handleSelect: SelectorCallback, handleChange: InputCallback) {
	const entries: Array<SuggestionEntry> = new Array<SuggestionEntry>();

	for (const suggestion of suggestions) {
		outer:
			for (let i = 0; i < suggestion.value.length; i++) {
				const source = suggestion.value[i];
				for (const entry of entries) {
					if (equals(entry.value, source)) {
						if (entry.key.length > suggestion.key.length) {
							entry.key = suggestion.key;
						}
						continue outer;
					}
				}
				entries.push(new SuggestionEntry(suggestion.key, source, suggestion.value.length > 1 ? typeToString(source) : null));
			}
	}
	return entries
		.slice(0, Math.min(10, entries.length))
		.map((entry, index) => {
			return <li key={index}
					   className="autocomplete-suggestion bg-secondary-subtle"
					   tabIndex={0}
					   onClick={() => handleSelect(entry.value)}
					   onKeyDown={event => {
						   function focus(key: string) {
							   const {activeElement: {[key]: elementSibling} = {}} = document as any;
							   if (elementSibling) {
								   elementSibling.focus();
							   } else {
								   const input = document.getElementsByClassName('autocomplete-input').item(0);
								   if (input) {
									   (input as any).focus();
								   }
							   }
						   }

						   if (event.key === 'ArrowDown') {
							   focus('nextElementSibling');
							   event.preventDefault();
						   } else if (event.key === 'ArrowUp') {
							   focus('previousElementSibling');
							   event.preventDefault();
						   } else if (event.key === 'Enter') {
							   handleSelect(entry.value);
							   event.preventDefault();
						   } else if (event.key.length === 1 || event.key === 'Backspace') {
							   const input = document.getElementsByClassName('autocomplete-input').item(0) as any;
							   if (input) {
								   if (event.key === 'Backspace') {
									   input.value = input.value.length === 0 ? input.value : input.value.substring(0, input.value.length - 1);
								   } else {
									   input.value += event.key;
								   }
								   event.preventDefault();
								   handleChange({target: input});
							   }
						   }
					   }}>
				{entry.key + (entry.duplicate !== null ? ' (' + entry.duplicate + ')' : '')}
			</li>;
		});
}