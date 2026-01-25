/*
 * Copyright (c) 2026 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReactElement, useEffect, useState} from "react";
import {EmbeddedViewRenderer, ViewRendererProps} from "./embed/EmbeddedView.tsx";
import {getAllData, getIndex, getParsedData} from "../data/DataFetcher.ts";
import {ReferenceSource} from "../data/ReferenceSource.ts";
import {Galaxy, GameColor, GameObject, Government, Point, System, Wormhole} from "../data/DataScheme.tsx";
import {AnimationDisplay} from "./AnimationDisplay.tsx";
import {SystemMap} from "./SystemMap.tsx";
import {createPath} from "../web_utils.ts";

type GalaxyMapProps = { name: string, time?: number, className?: string };

export function GalaxyMap(props: GalaxyMapProps): ReactElement | undefined {
	return <EmbeddedViewRenderer
		render={GalaxyMapRenderer}
		scale={0.3}
		maxScale={15}
		className={props.className}
		initialButtonStates={[true, true, true, true, true, true]}
		buttonTitles={['Toggle background', 'Toggle hyperlinks', 'Toggle wormholes', 'Toggle system labels', 'Toggle jump radius', 'Toggle system markers']}
		buttonContentGenerators={[
			state => <i className={'bi ' + (state ? 'bi-image-fill' : 'bi-image')}/>,
			state => <i className={'bi ' + (state ? 'bi-caret-right-square-fill' : 'bi-caret-right-square')}/>,
			state => <i className={'bi ' + (state ? 'bi-arrow-right-square-fill' : 'bi-arrow-right-square')}/>,
			state => <i className={'bi ' + (state ? 'bi-chat-left-fill' : 'bi-chat-left')}/>,
			state => <i className={'bi ' + (state ? 'bi-circle-fill' : 'bi-circle')}/>,
			state => <i className={'bi ' + (state ? 'bi-crosshair2' : 'bi-crosshair')}/>
		]}
		passthroughProps={{
			name: props.name,
			className: props.className
		}}/>;
}

function GalaxyMapRenderer(props: ViewRendererProps): ReactElement | undefined {
	// user state
	const [initialOffset, setInitialOffset] = useState(undefined as Point | undefined);
	const [selectedSystem, setSelectedSystem] = useState(props.passthroughProps.name as string);
	// static data
	const [galaxies, setGalaxies] = useState(undefined as Galaxy[] | undefined);
	const [governmentColors, setGovernmentColors] = useState(new Map<string, GameColor>());
	const [colors, setColors] = useState(new Map<string, GameObject>());
	const [wormholes, setWormholes] = useState(undefined as undefined | Wormhole[]);
	const [systemMap, setSystemMap] = useState(undefined as Map<string, GameObject> | undefined);
	const [systems, setSystems] = useState(undefined as System[] | undefined);
	// renders
	const [minSystemPos, setMinSystemPos] = useState(new Point() as Point);
	const [maxSystemPos, setMaxSystemPos] = useState(new Point() as Point);
	const [mapGalaxies, setMapGalaxies] = useState(undefined as ReactElement[] | undefined);
	const [mapHyperlanes, setMapHyperlanes] = useState(undefined as ReactElement | undefined);
	const [mapWormholes, setMapWormholes] = useState(undefined as ReactElement | undefined);
	const [mapLabels, setMapLabels] = useState(undefined as ReactElement | undefined);
	const [mapSystems, setMapSystems] = useState(undefined as ReactElement | undefined);
	const [map, setMap] = useState(undefined as ReactElement | undefined);

	// parse all galaxies and government colors
	useEffect(() => {
		getIndex('galaxy').then(galaxies => {
			Promise.all(galaxies.map(galaxy => getParsedData(new ReferenceSource('galaxy', galaxy))))
				.then(parsedGalaxies => setGalaxies(parsedGalaxies.map(g => g as Galaxy).filter(galaxy => galaxy.sprite)));
		});
	}, []);
	useEffect(() => {
		getAllData('color').then(colors => {
			setColors(colors);
			const map = new Map<string, GameColor>();
			getAllData('government').then(governments => {
				governments.values().forEach(gov => {
					const color: GameColor = (gov as Government).color;
					if (color.rgb) {
						map.set(gov.name, color);
					} else if (color.name) {
						const mappedColor = colors.get(color.name);
						if (mappedColor && (mappedColor as GameColor).rgb) {
							map.set(gov.name, mappedColor as GameColor);
						}
					}
				});
				setGovernmentColors(map);
			});
		});
	}, []);
	useEffect(() => {
		getAllData('wormhole').then(wormholeMap => {
			const wormholes = wormholeMap.values().map(wormhole => wormhole as Wormhole).toArray();
			setWormholes(wormholes);
		});
	}, []);
	// parse all systems
	useEffect(() => {
		getAllData('system').then(systemMap => {
			setSystemMap(systemMap);
			const systems: System[] = systemMap.values().map(s => s as System).toArray();
			setSystems(systems);
			const minSystemPos: Point = systems.length === 0 ? new Point() : new Point(systems[0].pos);
			const maxSystemPos: Point = systems.length === 0 ? new Point() : new Point(systems[0].pos);
			for (const system of systems) {
				minSystemPos.min(system.pos);
				maxSystemPos.max(system.pos);
			}
			setMinSystemPos(minSystemPos);
			setMaxSystemPos(maxSystemPos);
		})
	}, []);

	// Create background labels
	useEffect(() => {
		setMapGalaxies(galaxies?.map((label, index) => <div key={'label-' + index} style={{
			position: 'absolute',
			top: label.pos.y,
			left: label.pos.x,
			transform: `translate(50cqw, 50cqh) translate(-50%, -50%)`
		}}>
			<div style={{scale: label.sprite?.scale}}>
				<AnimationDisplay source={'everything/' + label.sprite?.name} title={label.displayName ?? label.sprite}/>
			</div>
		</div>));
	}, [galaxies]);

	// Hyperlanes
	useEffect(() => {
		if (!systems || !systemMap) {
			return;
		}
		setMapHyperlanes(
			<g className='galaxy-map-hyperlinks'>
				{
					systems.flatMap((system, index) => {
						const pos1 = new Point(system.pos);
						return system.links.map((link, linkIndex) => {
							if (link.localeCompare(system.name) > 0) {
								const otherSystem = systemMap.get(link) as System | undefined;
								if (otherSystem) {
									const pos2 = new Point(otherSystem.pos);
									return <line key={'hyperlink-' + index + '-' + linkIndex}
												 x1={pos1.x}
												 y1={pos1.y}
												 x2={pos2.x}
												 y2={pos2.y}
												 className='galaxy-map-hyperlink'
									/>;
								}
							}
							return undefined;
						});
					})
				}
			</g>
		);
	}, [systems, systemMap]);

	// Wormholes
	useEffect(() => {
		if (!systems || !systemMap || !colors || !governmentColors || !wormholes) {
			return;
		}
		setMapWormholes(
			<g className='galaxy-map-wormholes'>
				{
					wormholes.flatMap((wormhole, index) =>
						wormhole.links.map((link, linkIndex) => {
							if (systemMap.has(link.from) && systemMap.has(link.to)) {
								return <line key={'wormhole-' + index + '-' + linkIndex}
											 className='galaxy-map-wormhole'
											 markerEnd='url(#arrowhead)'
											 stroke={wormhole.color.rgba ?? colors ? (colors.get(wormhole.color.name) as GameColor | undefined)?.rgba : undefined}
											 x1={(systemMap.get(link.from) as System).pos.x}
											 y1={(systemMap.get(link.from) as System).pos.y}
											 x2={(systemMap.get(link.to) as System).pos.x}
											 y2={(systemMap.get(link.to) as System).pos.y}
								/>;
							}
							return undefined;
						})
					)
				}
			</g>);
	}, [systems, systemMap, colors, governmentColors, wormholes]);

	// System names
	useEffect(() => {
		if (!systems) {
			return;
		}
		setMapLabels(<g className='galaxy-map-system-labels'>
			{
				systems.map((system, index) =>
					<text key={'system-label-' + index} className='map-label'
						  fontSize={12}
						  x={system.pos.x + 5}
						  y={system.pos.y - 5}>
						{system.displayName}
					</text>
				)
			}
		</g>)
	}, [systems]);

	// Systems
	useEffect(() => {
		if (!systems) {
			return;
		}
		setMapSystems(<g className='galaxy-map-systems'>
			{
				systems.map((system, index) =>
					<g key={'system-' + index}
					   className='galaxy-map-system'
					>
						<line className='galaxy-map-system-ring'
							  x1={system.pos.x}
							  y1={system.pos.y}
							  x2={system.pos.x}
							  y2={system.pos.y}
							  stroke={system.government ? governmentColors.get(system.government)?.rgba ?? 'grey' : 'grey'}
							  onClick={_ => setSelectedSystem(system.name)}
							  onDoubleClick={_ => window.location.href = createPath('system/' + encodeURIComponent(system.name)).toString()}
						/>
						<line className={'galaxy-map-system-fill galaxy-map-system-fill-' + (selectedSystem === system.name ? 'selected' : 'unselected')}
							  x1={system.pos.x}
							  y1={system.pos.y}
							  x2={system.pos.x}
							  y2={system.pos.y}
							  onClick={_ => setSelectedSystem(system.name)}
							  onDoubleClick={_ => window.location.href = createPath('system/' + encodeURIComponent(system.name)).toString()}
						/>
					</g>
				)
			}
		</g>)
	}, [systems, selectedSystem, governmentColors]);

	// place systems and create map
	useEffect(() => {
		if (!systemMap || !systems) {
			return;
		}

		const showBackground = props.customToggleStates?.[0];
		const showHyperlinks = props.customToggleStates?.[1];
		const showWormholes = props.customToggleStates?.[2];
		const showLabels = props.customToggleStates?.[3];
		const showJumpRadius = props.customToggleStates?.[4];
		const showSystems = props.customToggleStates?.[5];

		let baseOffset_: Point | undefined;
		if (!initialOffset) {
			systems.forEach(system => {
				if (system.name === props.passthroughProps.name) {
					baseOffset_ = new Point(system.pos);
					baseOffset_.multiply(-1);
					setInitialOffset(baseOffset_);
					setSelectedSystem(props.passthroughProps.name);
				}
				if (!baseOffset_) {
					baseOffset_ = new Point();
					setInitialOffset(new Point());
				}
			});
		} else {
			baseOffset_ = initialOffset;
		}
		const baseOffset = baseOffset_ as Point;

		const svgOffset = 100 * (props.scale >= 1 ? props.scale : 1 / props.scale);

		setMap(<div className={`galaxy-map ${props.passthroughProps.className}`} style={{
			position: 'relative',
			containerType: 'size',
			overflow: 'hidden',
		}}>
			{
				showBackground ? <div className='galaxy-map-galaxies' style={{
					width: '100%',
					height: '100%',
					transform: `scale(${props.scale}) translate(${baseOffset.x + props.offset.x}px, ${baseOffset.y + props.offset.y}px)`
				}}>{mapGalaxies}</div> : undefined
			}
			<svg width={(maxSystemPos.x - minSystemPos.x + svgOffset * 2) * props.scale}
				 height={(maxSystemPos.y - minSystemPos.y + svgOffset * 2) * props.scale}
				 style={{
					 position: 'absolute',
					 top: (minSystemPos.y - svgOffset + baseOffset.y + props.offset.y) * props.scale,
					 left: (minSystemPos.x - svgOffset + baseOffset.x + props.offset.x) * props.scale,
					 transform: `translate(50cqw, 50cqh)`
				 }}>
				<g className='galaxy-map-global-group'
				   style={{
					   transform: `scale(${props.scale}) translate(${svgOffset}px, ${svgOffset}px) translate(${-minSystemPos.x}px, ${-minSystemPos.y}px)`
				   }}>
					<defs>
						<marker id='arrowhead'
								orient='auto'
								markerWidth={16}
								markerHeight={10}
								refX={20} refY={5}>
							<path d={`M0,0 V 10 L 16 5 Z`}
								  fill='context-stroke'/>
						</marker>
					</defs>
					{
						showHyperlinks ? mapHyperlanes : undefined
					}
					{
						showWormholes ? mapWormholes : undefined
					}
					{
						// jump range
						(() => {
							const storedSystem = systemMap.get(selectedSystem);
							if (storedSystem) {
								const system = storedSystem as System;
								return <circle
									className='galaxy-map-jump-range'
									cx={system.pos.x}
									cy={system.pos.y}
									r={system.jumpRange}
									display={showJumpRadius ? undefined : 'none'}
								/>
							}
							return undefined;
						})()
					}
					{
						showLabels && props.scale >= 0.75 ? mapLabels : undefined
					}
					{
						showSystems ? mapSystems : undefined
					}
				</g>
			</svg>
			{selectedSystem ? <div className='blue-border' style={{
				position: 'absolute',
				top: 0,
				left: 0,
				transform: 'translate(0, 100cqh) translate(0, -100%)'
			}}><SystemMap name={selectedSystem} className={'stat-box-map'}/></div> : undefined}
		</div>);
	}, [props, initialOffset, selectedSystem, systemMap, systems, minSystemPos, maxSystemPos, mapGalaxies, mapHyperlanes, mapWormholes, mapLabels, mapSystems]);

	return map;
}