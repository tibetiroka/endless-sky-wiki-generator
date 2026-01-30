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
import {Point, System, SystemPlanet} from "../data/DataScheme.tsx";
import {AnimationDisplay, getImageUrl} from "./AnimationDisplay.tsx";
import {EmbeddedViewRenderer, ViewRendererProps} from "./embed/EmbeddedView.tsx";
import {createPath} from "../web_utils.ts";

type SystemMapProps = { name: string, center?: string, time?: number, className?: string };

export function SystemMap(props: SystemMapProps): ReactElement | undefined {
	return <EmbeddedViewRenderer
		render={SystemMapRenderer}
		scale={0.3}
		className={props.className}
		initialButtonStates={[true, true, true]}
		buttonTitles={['Toggle orbits', 'Toggle asteroid belts', 'Toggle planet labels']}
		buttonContentGenerators={[
			state => <i className={'bi ' + (state ? 'bi-crosshair2' : 'bi-crosshair')}/>,
			state => <i className={'bi ' + (state ? 'bi-circle-fill' : 'bi-circle')}/>,
			state => <i className={'bi ' + (state ? 'bi-chat-left-fill' : 'bi-chat-left')}/>
		]}
		passthroughProps={{
			name: props.name,
			center: props.center,
			time: props.time ?? 1100863,
			className: props.className
		}}/>;
}

function SystemMapRenderer(props: ViewRendererProps): ReactElement | undefined {
	const [initialOffset, setInitialOffset] = useState(undefined as Point | undefined);
	const [system, setSystem] = useState(undefined as System | undefined);
	const [map, setMap] = useState(undefined as ReactElement | undefined);

	useEffect(() => {
		getParsedData(new ReferenceSource('system', props.passthroughProps.name)).then(data => setSystem(data as System));
	}, [props.passthroughProps.name]);

	useEffect(() => {
		if(system) {
			const objectPositions = system.objectsAndPositions(props.passthroughProps.time);
			for (const object of objectPositions.objects) {
				if (object.object.isPlanet && (object.object.object as SystemPlanet).gameObject.name === props.passthroughProps.center) {
					setInitialOffset(new Point(object.position));
				}
			}
		}
	}, [props.passthroughProps.time, props.passthroughProps.center, system]);

	useEffect(() => {
		if(!system) {
			return;
		}
		const actualOffset = new Point(initialOffset);
		actualOffset.multiply(-1);
		actualOffset.add(props.offset);
		const showOrbits = (props.customToggleStates as boolean[])[0];
		const showBelts = (props.customToggleStates as boolean[])[1];
		const showLabels = (props.customToggleStates as boolean[])[2];

		const objectPositions = system.objectsAndPositions(props.passthroughProps.time);
		const svgOffset = Math.max(10, 10 / props.scale);
		const svgOffsetText = Math.max(500, 500 / props.scale);
		setMap(<div className={`system-map ${props.passthroughProps.className}`} style={{
				position: 'relative',
				containerType: 'size',
				overflow: 'hidden',
				backgroundImage: `url(${getImageUrl('everything/' + system.haze).toString()})`
			}}>
				<div style={{
					scale: props.scale,
					height: '100%'
				}}>
					{
						// belts
						system.belts.map((belt, index) => {
							const topY = actualOffset.y - belt;
							const leftX = actualOffset.x - belt;
							return <svg key={'belt-' + index}
										width={belt * 2 + svgOffset * 2}
										height={belt * 2 + svgOffset * 2}
										style={{
											position: 'absolute',
											top: topY - svgOffset,
											left: leftX - svgOffset,
											transformOrigin: 'top left',
											transform: `translate(50cqw, 50cqh)`,
											display: showBelts ? undefined : 'none'
										}}>
								<circle cx={belt + svgOffset} cy={belt + svgOffset} r={belt} stroke='saddlebrown' strokeWidth={10 / props.scale} fillOpacity='0'/>
							</svg>
						})
					}
					{
						// orbits
						objectPositions.objects.map((obj, index) => {
							const topY = obj.orbitalCenter.y - obj.orbitalRadius + actualOffset.y;
							const leftX = obj.orbitalCenter.x - obj.orbitalRadius + actualOffset.x;
							return <svg key={'orbit-' + index}
										width={obj.orbitalRadius * 2 + svgOffset * 2}
										height={obj.orbitalRadius * 2 + svgOffset * 2}
										style={{
											position: 'absolute',
											top: topY - svgOffset,
											left: leftX - svgOffset,
											transformOrigin: 'top left',
											transform: `translate(50cqw, 50cqh)`,
											display: showOrbits ? undefined : 'none'
										}}>
								<circle cx={obj.orbitalRadius + svgOffset} cy={obj.orbitalRadius + svgOffset} r={obj.orbitalRadius} stroke='grey' strokeWidth={2 / props.scale} fillOpacity='0'/>
							</svg>
						})
					}
					{
						// planets
						objectPositions.objects.map((obj, index) => {
							const topY = obj.position.y + actualOffset.y;
							const leftX = obj.position.x + actualOffset.x;
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
						})
					}
					{
						// labels
						<svg width={objectPositions.max.x - objectPositions.min.x + 2 * svgOffsetText}
							 height={objectPositions.max.y - objectPositions.min.y + 2 * svgOffsetText}
							 style={{
								 position: 'absolute',
								 top: objectPositions.min.y - svgOffsetText + actualOffset.y,
								 left: objectPositions.min.x - svgOffsetText + actualOffset.x,
								 transformOrigin: 'top left',
								 transform: 'translate(50cqw, 50cqh)',
								 display: showLabels ? undefined : 'none'
							 }}>
							{
								objectPositions.objects.map((object, index) => {
									if (object.object.isPlanet) {
										return <text key={'label-' + index}
													 x={object.position.x - objectPositions.min.x + svgOffsetText + 5 / props.scale}
													 y={object.position.y - objectPositions.min.y + svgOffsetText - 5 / props.scale}
													 className='map-label'
													 fontSize={Math.min(200, 40 / props.scale)}>{(object.object.object as SystemPlanet).gameObject.displayName}</text>
									}
									return undefined;
								})}
						</svg>
					}
				</div>
			</div>
		);
	}, [props, initialOffset, system]);

	return map;
}