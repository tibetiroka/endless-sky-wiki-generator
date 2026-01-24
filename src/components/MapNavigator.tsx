/*
 * Copyright (c) 2026 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReferenceSource} from "../data/ReferenceSource.ts";
import {Button} from "react-bootstrap";
import {createPath} from "../web_utils.ts";

type MapItemNavigationProps = { source: ReferenceSource }

export function MapItemNavigation(props: MapItemNavigationProps) {
	return <div>
		{props.source.type === 'system' ?
			<Button className='nav-button btn-secondary' onClick={() => {
				window.location.href = createPath('map?system=' + encodeURIComponent(props.source.name as string)).toString();
			}}>
				<i className={'bi bi-globe-americas'}></i>
				{' System map'}
			</Button> : undefined}
		{props.source.type === 'system' ?
			<Button className='nav-button btn-secondary' onClick={() => {
				window.location.href = createPath('map?galaxy-center=' + encodeURIComponent(props.source.name as string)).toString();
			}}>
				<i className={'bi bi-map-fill'}></i>
				{' Galaxy map'}
			</Button> : undefined}
	</div>
}