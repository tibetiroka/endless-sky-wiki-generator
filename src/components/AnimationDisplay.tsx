/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {getDataUrl} from "../web_utils.ts";
import {getEsUrl} from "../data/DataFetcher.ts"
import {CSSProperties, SyntheticEvent} from "react";

type OnLoadType = (event: SyntheticEvent<HTMLImageElement, Event>) => void;
type AnimationDisplayProps = {
	source: string,
	onLoad?: OnLoadType,
	title?: string,
	style?: CSSProperties
};

export function getImageUrl(source: string): URL {
	if (source.startsWith('everything/')) {
		source = source.substring(0, source.lastIndexOf('/'))
			+ '/sprite_'
			+ source.substring(source.lastIndexOf('/') + 1);
	}
	return getDataUrl('assets/' + source);
}

export function AnimationDisplay(props: AnimationDisplayProps) {
	if (!props.source) {
		return;
	}

	return <div className='animation-display-wrapper'>
		<img className='animation-display'
			 src={getImageUrl(props.source).toString()}
			 title={props.title}
			 alt=''
			 loading='lazy'
			 style={props.style}
			 onError={(error) => {
				 (error.target as any).src = getEsUrl('images/outfit/unknown.png').toString();
			 }}
			 onDragStart={event => {
				 event.preventDefault();
			 }}
			 onLoad={props.onLoad}/>
	</div>
}