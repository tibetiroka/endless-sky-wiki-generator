/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReactElement, useEffect, useState} from "react";
import {getParsedData} from "../data/DataFetcher.ts";
import {ReferenceSource} from "../data/ReferenceSource.ts";
import {System, SystemPlanet} from "../data/DataScheme.tsx";
import {AnimationDisplay} from "./AnimationDisplay.tsx";
import {EmbeddedViewRenderer, ViewRendererProps} from "./embed/EmbeddedView.tsx";
import {createPath} from "../web_utils.ts";

type SystemMapProps = { name: string, time?: number, className?: string };

export function SystemMap(props: SystemMapProps): ReactElement | undefined {
	return <EmbeddedViewRenderer render={SystemMapRenderer} scale={0.3} className={props.className} passthroughProps={{
		name: props.name,
		time: props.time ?? 1100863,
		className: props.className
	}}/>;
}

function SystemMapRenderer(props: ViewRendererProps): ReactElement | undefined {
	const [map, setMap] = useState(undefined as ReactElement | undefined);

	useEffect(() => {
		getParsedData(new ReferenceSource('system', props.passthroughProps.name)).then(data => data as System).then(system => {
			const objectPositions = system.objectsAndPositions(props.passthroughProps.time);
			setMap(<div className={`system-map ${props.passthroughProps.className}`} style={{
					position: 'relative',
					containerType: 'size',
					overflow: 'hidden'
				}}>
					<div style={{
						scale: props.scale,
						height: '100%'
					}}>
						{objectPositions.objects.map((obj, index) => {
							const topY = obj.orbitalCenter.y - obj.orbitalRadius + props.offset.y;
							const leftX = obj.orbitalCenter.x - obj.orbitalRadius + props.offset.x;
							return <div key={index + "-orbit"} className='system-map-element' style={{
								position: 'absolute',
								top: topY,
								left: leftX,
								transform: 'translate(50cqw, 50cqh)',
								border: '2px solid grey',
								borderRadius: obj.orbitalRadius,
								height: obj.orbitalRadius * 2,
								width: obj.orbitalRadius * 2
							}}/>
						})}
						{objectPositions.objects.map((obj, index) => {
							const topY = obj.position.y + props.offset.y;
							const leftX = obj.position.x + props.offset.x;
							let objectName = obj.object.object.sprite?.name;
							if (obj.object.isPlanet) {
								const planet: SystemPlanet = obj.object.object as SystemPlanet;
								objectName = planet.gameObject.displayName ?? planet.gameObject.name;
							}
							return <div key={index + "-object"} className='system-map-element' style={{
								position: 'absolute',
								top: topY,
								left: leftX,
								transform: 'translate(50cqw, 50cqh) translate(-50%, -50%) rotate(' + (Math.atan2(obj.position.y, obj.position.x) + Math.PI / 2) + 'rad)',
							}}
										onDoubleClick={(event: any) => {
											if (obj.object.isPlanet) {
												window.location.href = createPath('planet/' + encodeURIComponent((obj.object.object as SystemPlanet).gameObject.name)).toString();
											}
											event?.preventDefault();
										}}>
								<div style={{scale: obj.object.object.sprite?.scale}}>
									<AnimationDisplay source={'everything/' + obj.object.object.sprite?.name} title={objectName}/>
								</div>
							</div>
						})}
					</div>
				</div>
			);
		});
	}, [props]);

	return map;
}