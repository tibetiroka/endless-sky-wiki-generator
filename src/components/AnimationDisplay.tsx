/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {useState} from "react";
import {getEsUrl, getFileList} from "../data/DataFetcher.ts";

export type Animation = string | { name: string, "frame rate"?: string, rewind?: string };
export type AnimationDisplayProps = { animation: Animation };

export function AnimationDisplay(props: AnimationDisplayProps) {
	const [paths, setPaths] = useState(undefined as undefined | string[]);
	if(!props.animation) {
		return;
	}

	if (!paths) {
		getFileList().then(files => {
			setPaths(files.images[typeof (props.animation) === 'string' ? props.animation : (props.animation as {
				name: string
			}).name] ?? ['images/outfit/unknown.png']);
		});
	}

	const animationName = paths?.map(path => path.replace(/[/\\<>.\s]/g, _ => '_')).join('___');
	const frameRate = Number.parseFloat(typeof (props.animation) === 'string' ? '60' : (props.animation as {
		"frame rate"?: string
	})["frame rate"] ?? '60');
	const rewind = (typeof (props.animation) === 'string' ? false : (props.animation as {
		'rewind'?: any
	}).rewind);

	return <div  key={"div-" + animationName} id={animationName} className='image-display' style={{animationName}}>
		<style key={"style-" + animationName}>
			{
				"@keyframes " + animationName + " {\n" +
				paths?.map((path, index) => {
					const ratio = index / paths?.length;

					function toFrame(ratio: number) {
						return (ratio * 100) + "% {background-image: url(\"" + getEsUrl(path) + "\");}\n";
					}
					if(index === 0 && !rewind) {
						return toFrame(ratio) + toFrame(1);
					}
					else if(index === (paths as string[]).length - 1 && rewind) {
						return toFrame(ratio) + toFrame(1);
					}
					else {
						return toFrame(ratio);
					}
				}).join('\n') +
				"}\n" +
				"#" + animationName + "{\n" +
				"animation-duration: " + ((paths?.length ?? 0) / frameRate).toString() + "s;\n" +
				(rewind ? "animation-direction: alternate-reverse;\n" : "") +
				(paths?.length ?? 0 > 1 ? 'animation-delay: 1s;\n' : '') +
				"}\n"
			}
		</style>
		{paths?.map(path => <link key={path} rel="preload" as='image' href={getEsUrl(path).toString()}/>)}
		{paths?.map(path => <link key={path} rel="prerender" type='image' href={getEsUrl(path).toString()}/>)}
	</div>
	/*return <div className='image-display'>
		{paths?.map((path, index) =>
			<img key={path} alt='' src={getEsUrl(path).toString()} style={{animationDelay: (0.015 * index).toString()}}/>)}
	</div>*/

	//return <img className='image-display' alt='' src={(props.ref ? getEsUrl('images/outfit/unknown.png', props.ref) : getEsUrl('images/outfit/unknown.png')).toString()}/>
}