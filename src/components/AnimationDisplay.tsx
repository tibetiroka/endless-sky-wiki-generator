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
import {CSSProperties, ReactElement, SyntheticEvent, useCallback, useEffect, useState} from "react";
import {asArray, Sprite} from "../data/DataScheme.tsx";

type OnLoadType = (event: SyntheticEvent<HTMLImageElement, Event>) => void;
type AnimationDisplayProps = {
	source: string | Sprite | undefined | (string | Sprite | undefined)[],
	onLoad?: OnLoadType,
	title?: string,
	style?: CSSProperties
};

export function getImageUrl(source: string | Sprite): URL {
	if (typeof (source) !== 'string') {
		source = 'everything/' + source.name;
	}
	if (source.startsWith('everything/')) {
		source = source.substring(0, source.lastIndexOf('/'))
			+ '/sprite_'
			+ source.substring(source.lastIndexOf('/') + 1);
	}
	return getDataUrl('assets/' + source);
}

export function AnimationDisplay(props: AnimationDisplayProps) {
	const [sourceIndex, setSourceIndex] = useState(0);
	const [sourceUrls, setSourceUrls] = useState([] as string[]);
	const [image, setImage] = useState(undefined as undefined | ReactElement);

	useEffect(() => {
		let sources: (string | Sprite)[] = asArray(props.source).filter(source => source !== undefined && source !== '');
		sources = sources.map(source => getImageUrl(source).toString());
		sources.push(getEsUrl('images/outfit/unknown.png').toString());
		setSourceUrls(sources as string[]);
		setSourceIndex(0);
	}, [props.source]);

	const onError = useCallback((_: any) => {
		setSourceIndex(sourceIndex + 1);
	}, [sourceIndex]);

	useEffect(() => {
		if (sourceIndex < sourceUrls.length) {
			setImage(<div className='animation-display-wrapper'>
				<img className='animation-display'
					 src={sourceUrls[sourceIndex]}
					 title={props.title}
					 alt=''
					 loading='lazy'
					 style={
						 {
							 scale: Array.isArray(props.source) && props.source.length < sourceIndex && typeof (props.source[sourceIndex]) !== 'string' ? (props.source[sourceIndex] as Sprite).scale : undefined,
							 ...props.style
						 }
					 }
					 onError={onError}
					 onDragStart={event => {
						 event.preventDefault();
					 }}
					 onLoad={props.onLoad}/>
			</div>);
		}
	}, [sourceIndex, sourceUrls, props, onError]);

	return image;
}