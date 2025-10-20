/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {toURL} from "../data/ReferenceSource.ts";
import {ObjectData} from "../data/ObjectData.tsx";

type ReferenceLinkProps = { data: ObjectData };

function ReferenceLink(props: ReferenceLinkProps) {
	return <a href={toURL(props.data.getSource()).toString()}>{props.data.displayName}</a>;
}

export default ReferenceLink;