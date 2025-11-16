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

type AnimationDisplayProps = { source: string };

export function AnimationDisplay(props: AnimationDisplayProps) {
	if (!props.source) {
		return;
	}

	return <div className='animation-display-wrapper'>
		<video className='animation-display' src={getDataUrl('assets/' + props.source).toString()} loop autoPlay muted onError={(error) => {
			(error.target as any).style.display = 'none';
		}} onLoad={event => {
			const target: any = event.target;
			target.muted = true;
			target.defaultMuted = true;
			target.play();
		}}/>
		<img className='animation-display' src={getDataUrl('assets/' + props.source).toString()} alt='' onError={(error) => {
			(error.target as any).style.display = 'none';
		}}/>
	</div>
}