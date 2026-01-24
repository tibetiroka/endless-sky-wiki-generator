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
import {SystemMap} from "../components/SystemMap.tsx";
import {GalaxyMap} from "../components/GalaxyMap.tsx";

export function MapPage() {
	const [titleSet, setTitleSet] = useState(false);

	if (!titleSet) {
		setTitleSet(true);
		// titleSet won't update during this call, so we can query it still
	}

	const urlParams = new URLSearchParams(window.location.search);
	const system: string | null = urlParams.get('system');
	const centerPlanet: string | null = urlParams.get('system-center');
	const galaxyCenter: string | null = urlParams.get('galaxy-center');
	if (system) {
		if(!titleSet) {
			document.title = 'System view | ' + document.title;
		}
		return <>
			<section>
				<h1>Map of {system}</h1>
				<SystemMap name={system} center={centerPlanet ?? undefined} className='standalone-map'/>
			</section>
		</>
	} else if(galaxyCenter) {
		if(!titleSet) {
			document.title = 'Galaxy view | ' + document.title;
		}
		return <>
			<section>
				<h1>Galaxy map</h1>
				<GalaxyMap name={galaxyCenter} className='standalone-map'/>
			</section>
		</>
	}
}