/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReferenceData, ReferenceSource, toURL} from "../data/ReferenceSource.ts";
import {useState} from "react";
import {getData, getDisplayName, getReferences} from "../data/DataFetcher.tsx";
import {findSource} from "../utils.ts";

//todo: remove 'data'
type ReferenceLinkProps = { source: ReferenceSource, displayName: string, count?: number };

export function ReferenceLink(props: ReferenceLinkProps) {
	return <>
		<a href={toURL(props.source).toString()}>{props.displayName}</a>
		{props.count && props.count > 1 ? ' (' + props.count.toString() + ')' : undefined}
		{props.displayName !== props.source.name ? <small style={{fontStyle: 'italic'}}>{' (' + props.source.name + ')'}</small> : undefined}
	</>;
}

type ReferenceLinkListProps = { sources: ReferenceSource[], categoryType?: string, counts?: number[] };

export function ReferenceLinkList(props: ReferenceLinkListProps) {
	let [displayNames, setDisplayNames] = useState(undefined as string[] | undefined);
	let [categories, setCategories] = useState(undefined as string[] | undefined);
	let [references, setReferences] = useState(undefined as ReferenceData | undefined);

	if (!displayNames && !props.categoryType) {
		Promise.all(props.sources.map(source => getDisplayName(source))).then(data => setDisplayNames(data));
	}
	if (!categories && props.categoryType) {
		getData(new ReferenceSource('category\\' + props.categoryType, null))
			.then(data => {
				setCategories(Object.keys(data.getData())
					.filter(key => key !== 'name'));
			});
	}
	if (!references && props.categoryType) {
		getReferences('category\\' + props.categoryType)
			.then(data => setReferences(data));
	}

	function filterElements(filter: ReferenceSource[]): { source: ReferenceSource, index: number }[] {
		return props.sources.flatMap((source, index) => {
			if (findSource(source, filter) !== null) {
				return [{source, index}];
			}
			return [];
		});
	}

	if ((displayNames || props.categoryType) && ((categories && references) || !props.categoryType)) {
		if (props.categoryType) {
			return <ul>
				{(categories as string[]).map(category => {
						const sources = filterElements((references as ReferenceData)[category] ?? []);
						if (sources.length > 0) {
							return <li key={category}>
								{category}
								<ReferenceLinkList
									sources={sources.map(a => a.source)}
									counts={props.counts ? sources.map(a => (props.counts as number[])[a.index]) : undefined}
								/>
							</li>
						}
						return undefined;
					}
				)}
			</ul>
		} else {
			return <ul>
				{(displayNames as string[])
					.map((displayName, index) => {
						return {displayName, 'source': props.sources[index]};
					})
					.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
					.map(({displayName, source}, index) =>
						<li key={source.type + '/' + source.name}>
							<ReferenceLink source={source} displayName={displayName} count={props.counts ? props.counts[index] : undefined}/>
						</li>)}
			</ul>
		}
	}
}