/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {DiffData} from "../data/ChangeData.ts";

type PatchProps = { diffData: DiffData | DiffData[] };

function Patch(props: PatchProps) {
	return <>
		<table className="diff-container">
			<tbody>
			{
				(Array.isArray(props.diffData) ? props.diffData : [props.diffData])
					.map(data => data.diff)
					.flatMap((diff, diffIndex) =>
						diff.split('\n').map((line, index) =>
							<tr key={diffIndex.toString() + '/' + index.toString()}>
								<td className={
									index < 2 ? 'bg-info-subtle' :
										line.charAt(0) === '+' ? 'bg-success-subtle' :
											line.charAt(0) === '-' ? 'bg-danger-subtle' :
												line.charAt(0) === '@' ? 'bg-info-subtle' :
													'bg-secondary-subtle'
								}>{line}</td>
							</tr>
						)
					)
			}
			</tbody>
		</table>
	</>
}

export default Patch;