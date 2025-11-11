/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {BulkChangeData, ChangeData} from '../data/ChangeData.ts'
import {getCommitURL} from "../data/DataFetcher.ts";
import Patch from "./Patch.tsx";

type ChangelogProps = { entries: ChangeData[] | BulkChangeData[] }

export function Changelog(props: ChangelogProps) {
	const isBulk: boolean = props.entries.length === 0 || Array.isArray(props.entries[0].diff);
	return <>
		{props.entries.map(entry =>
			<details key={entry.commit.hash}>
				<summary>
					{(!isBulk && (entry as ChangeData).diff.added) ? <span className="text-success">(added) </span> : undefined}
					{(!isBulk && (entry as ChangeData).diff.removed) ? <span className="text-danger">(removed) </span> : undefined}
					{(!isBulk && !(entry as ChangeData).diff.removed && !(entry as ChangeData).diff.added) ?
						<span className="text-info">(edited) </span> : undefined}
					<span style={{fontStyle: "italic"}}>{entry.commit.author}</span>
					{": " + entry.commit.message + ' '}
					<a href={getCommitURL(entry.commit.hash).toString()}>(view commit)</a>
				</summary>
				{<Patch diffData={entry.diff}/>}
			</details>
		)}
	</>
}