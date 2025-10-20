/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import {ReferenceSource, toURL} from "./data/ReferenceSource.ts";
import React, {ReactElement, useState} from "react";
import {getChangelog, getCommitURL, getData, getInteractiveFileURL, getReferences} from "./data/DataFetcher.tsx";
import {ObjectData} from './data/ObjectData.tsx'
import {Navigate} from "react-router";
import {findSource} from "./utils.ts";
import {Alert} from "react-bootstrap";
import {CommitData} from "./data/CommitData.tsx";
import {ChangeData} from "./data/ChangeData.tsx";
import Patch from "./components/Patch.tsx";
import ReferenceLink from "./components/ReferenceLink.tsx";

export type SectionGenerator = (source: ReferenceSource, title?: string) => Element | Element[] | ReactElement | ReactElement[] | undefined;

export class PageGenerator {
	title?: SectionGenerator = TitleGenerator;
	preamble?: SectionGenerator = PreambleGenerator;
	description?: SectionGenerator = DescriptionGenerator;
	landingLocations?: SectionGenerator = LandingLocationGenerator;
	links?: SectionGenerator = LinkGenerator;
	location?: SectionGenerator = LocationGenerator;
	outfits?: SectionGenerator = OutfitGenerator;
	ships?: SectionGenerator = ShipGenerator;
	outfitters?: SectionGenerator = OutfitterGenerator;
	shipyards?: SectionGenerator = ShipyardGenerator;
	variants?: SectionGenerator = VariantListGenerator;
	trivia?: SectionGenerator = TriviaGenerator;
}

export const CUSTOM_PAGE_GENERATORS = new Map<ReferenceSource, PageGenerator>();

type SourceProps = { source: ReferenceSource, title?: string };

function WikiPage(props: SourceProps) {
	const mappedSource: ReferenceSource | null = findSource(props.source, CUSTOM_PAGE_GENERATORS.keys());
	const generator = mappedSource ? CUSTOM_PAGE_GENERATORS.get(mappedSource) as PageGenerator : new PageGenerator();

	return <>
		{generator.title ? generator.title.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.preamble ? generator.preamble.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.description ? generator.description.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.landingLocations ? generator.landingLocations.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.links ? generator.links.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.location ? generator.location.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.outfits ? generator.outfits.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.ships ? generator.ships.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.outfitters ? generator.outfitters.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.shipyards ? generator.shipyards.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.variants ? generator.variants.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.trivia ? generator.trivia.call(generator, props.source, props.title) ?? <></> : <></>}
	</>;
}

export function TitleGenerator(source: ReferenceSource, title?: string) {
	let [heading, setHeading] = useState(undefined as ReactElement | undefined);
	if (!heading) {
		if (title) {
			setHeading(<h1 className="text-dark">{title}</h1>);
		} else {
			if (source.type === 'category') {
				setHeading(<h1>{source.name}</h1>);
			} else {
				getData(source).then(value => {
					setHeading(
						<>
							<h1>{value.displayName}</h1>
							{value.displayName === value.getSource().name ? <></>
								: <small style={{fontStyle: "italic"}}>Internally: {value.getSource().name}</small>}
						</>);
				}).catch(() => {
					setHeading(<Navigate to={{pathname: '/'}}/>);
				});
			}
		}
	}

	let [removedNotice, setRemovedNotice] = useState(undefined as ReactElement | undefined);
	if (!removedNotice) {
		getData(source).then(data => {
			if (data.isRemoved()) {
				const commit: CommitData = data.getRemovedCommit() as CommitData;
				removedNotice = <Alert variant="danger">
					This {source.type} was <a href={getCommitURL(commit.hash).toString()}>removed</a> in {commit.tag}. It is no longer part of the game.
				</Alert>
				setRemovedNotice(removedNotice);
			}
		});
	}

	let stubNotice: ReactElement | undefined = undefined;
	const stubTypes: string[] = ["system", "government", "minable", "category"];
	if (!title && stubTypes.includes(source.type)) {
		stubNotice = <Alert variant="warning">
			This article is automatically generated and is a stub. You can read about how to expand it <a href='/'>here: todo</a>.
		</Alert>
	}

	return <>
		{heading}
		{removedNotice}
		{stubNotice}
	</>
}

export function PreambleGenerator(source: ReferenceSource, title?: string) {
	let [preamble, setPreamble] = useState(undefined as ReactElement | undefined);
	if (!preamble) {
		getChangelog(source).then(changelog => {
			if (changelog.length) {
				getData(source).then(data => {
					preamble = <>
						<span>
							{data.displayName + " is " + (source.type.match('^[aeiouAEIOU].*') ? 'an' : 'a') + ' ' + source.type + " "}
							<a href={getCommitURL(changelog[0].commit.hash).toString()}>added</a>
							{" to the game in " + changelog[0].commit.tag + "."}
						</span>
					</>;
					setPreamble(preamble);
				});
			}
		});
	}
	return preamble;
}

export function DescriptionGenerator(source: ReferenceSource, title?: string) {
	let [description, setDescription] = useState(undefined as ReactElement | undefined);
	if (!description) {
		getData(source).then(data => {
			const desc: string[] | undefined | string = data.getData().description;
			if (desc) {
				description = <>
					<h2>Description</h2>
					{(typeof desc === 'string') ? <p>{desc}</p> : (desc as string[]).map(text =>
						<p key={text}>{text}</p>)}
				</>;
				setDescription(description);
			}
		});
	}
	return description;
}

export function LandingLocationGenerator(source: ReferenceSource, title?: string) {
	let [planets, setPlanets] = useState(undefined as ReactElement | undefined);

	function toDataArray(data: any | any[] | undefined): any[] {
		if (!data) {
			return [];
		} else if (data.constructor === Array) {
			return data;
		}
		return [data];
	}

	function flatMapObjects(data: any | any[] | undefined): string[] {
		return toDataArray(data).flatMap(value => {
			const elements: string[] = [];
			if (value['object']) {
				elements.push(...flatMapObjects(value['object']));
			}
			if (value['name']) {
				elements.push(value['name']);
			}
			return elements;
		});
	}

	if (!planets && source.type === 'system') {
		getData(source).then(data => {
			const objectData: any | any[] | undefined = data.getData()['object'];
			const landableArray: string[] = flatMapObjects(objectData);
			if (landableArray.length > 0) {
				Promise.all(landableArray.map(name => getData(new ReferenceSource('planet', name)))).then(allData => {
					setPlanets(<>
						<h2>Landing locations</h2>
						{data.displayName} has {landableArray.length} landing {landableArray.length === 1 ? 'location' : 'locations'}:
						<ul>
							{allData
								.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
								.map(landableData =>
									<li key={landableData.getSource().name}>
										<ReferenceLink data={landableData}/>
									</li>)}
						</ul>
					</>)
				})
			} else {
				setPlanets(<>
					<h2>Landing locations</h2>
					{data.displayName} doesn't have any landing locations.
				</>);
			}
		});
	}

	return planets;
}

export function LinkGenerator(source: ReferenceSource, title?: string) {
	let [links, setLinks] = useState(undefined as ReactElement | undefined);
	if (!links && source.type === 'system') {
		getData(source).then(data => {
			const dataLinks: string | string[] | undefined = data.getData()['link'];
			if (dataLinks) {
				const linkArray: string[] = typeof dataLinks === 'string' ? [dataLinks] : (dataLinks as string[]);
				Promise.all(linkArray.map(link => getData(new ReferenceSource('system', link)))).then(linkData => {
					setLinks(<>
						<h2>Links</h2>
						<details>
							<summary>{data.displayName} links to {linkData.length === 1 ? '1 system' : linkData.length + ' systems'}:</summary>
							<ul>
								{linkData.map(data => <li key={data.getSource().name}><ReferenceLink data={data}/>
								</li>)}
							</ul>
						</details>
					</>);
				});
			} else {
				setLinks(<>
					<h2>Links</h2>
					{data.displayName} isn't linked to any systems.
				</>);
			}
		});
	}

	return links;
}

export function LocationGenerator(source: ReferenceSource, title?: string) {
	let [location, setLocation] = useState(undefined as ReactElement | undefined);
	if (!location) {
		switch (source.type) {
			case 'fleet':
				getReferences(source.type).then(references => {
					let myReferences: ReferenceSource[] = references[source.name as string] ?? [];
					if (myReferences) {
						myReferences = myReferences.filter(reference => reference.type === 'system');
						if (myReferences.length > 0) {
							Promise.all(myReferences.map(r => getData(r))).then(allData => {
								location = <>
									<h2>Location</h2>
									<details>
										<summary>This fleet can appear in the following systems:</summary>
										<ul>
											{allData
												.sort((a, b) => a.displayName.localeCompare(b.displayName))
												.map(data =>
													<li key={data.getSource().name as string}>
														<ReferenceLink data={data}/>
													</li>)
											}
										</ul>
									</details>
								</>
								setLocation(location);
							})
						} else {
							setLocation(<>
								<h2>Location</h2>
								This fleet doesn't appear in any system.
							</>);
						}
					}
				});
				break;
			case 'government':
				getReferences(source.type).then(references => {
					const myReferences: ReferenceSource[] = references[source.name as string] ?? [];
					const planets: ReferenceSource[] = myReferences.filter(source => source.type === 'planet');
					const systems: ReferenceSource[] = myReferences.filter(source => source.type === 'system');
					if (planets.length > 0 || systems.length > 0) {
						Promise.all(planets.map(planet => getData(planet))
							.concat(systems.map(system => getData(system))))
							.then(mergedData => {
									setLocation(<>
										<h2>Location</h2>
										{planets.length === 0 ?
											<p>There are no planets directly belonging to this government.</p> : <details>
												<summary>The following planets are assigned to this government:</summary>
												<ul>
													{mergedData
														.slice(0, planets.length)
														.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
														.map(data =>
															<li key={data.getSource().name as string}>
																<ReferenceLink data={data}/>
															</li>)}
												</ul>
											</details>}
										{systems.length === 0 ?
											<p>There are no systems directly belonging to this government.</p> : <details>
												<summary>The following systems are assigned to this government:</summary>
												<ul>
													{mergedData
														.slice(planets.length, mergedData.length)
														.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
														.map(data =>
															<li key={data.getSource().name as string}>
																<ReferenceLink data={data}/>
															</li>)}
												</ul>
											</details>}
									</>);
								}
							);
					} else {
						setLocation(<>
							<h2>Location</h2>
							There are no systems or planets belonging to this government.
						</>)
					}
				});
				break;
			case 'minable':
				// minables aren't parsed properly yet. Backend todo.
				break;
			case 'outfitter':
			case 'shipyard':
				getReferences(source.type).then(references => {
					const myReferences: ReferenceSource[] = references[source.name as string] ?? [];
					const planets: ReferenceSource[] = myReferences.filter(source => source.type === 'planet');
					if (planets.length > 0) {
						Promise.all(planets.map(source => getData(source))).then(planetData => {
							setLocation(<>
								<h2>Location</h2>
								<details>
									<summary>This {source.type} appears on {planets.length === 1 ? '1 planet' : planets.length + ' planets'}:</summary>
									<ul>
										{planetData
											.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
											.map(planet =>
												<li key={planet.getSource().name}>
													<ReferenceLink data={planet}/>
												</li>)}
									</ul>
								</details>
							</>);
						});
					} else {
						setLocation(<>
							<h2>Location</h2>
							This {source.type} doesn't appear on any planets.
						</>);
					}
				});
				break;
			case 'planet':
				// planet references are broken, backend todo
				break;
		}
	}
	return location;
}

export function OutfitGenerator(source: ReferenceSource, title?: string) {
	let [outfits, setOutfits] = useState(undefined as ReactElement | undefined);
	if (!outfits) {
		if (source.type === 'ship') {
			getData(source).then(data => {
				// todo: check the parent ship, I don't even remember how that works
				const outfits: string[] = Object.keys(data.getData()['outfits'] ?? {});
				if (outfits.length > 0) {
					Promise.all(outfits.map(outfit => getData(new ReferenceSource('outfit', outfit))))
						.then(outfitData => {
							setOutfits(<>
								<h2>Outfits</h2>
								The {data.displayName} has the following outfits installed:
								<ul>
									{/*todo: use a table, and group by category*/}
									{outfitData.map(outfit =>
										<li key={outfit.getSource().name}>
											<ReferenceLink data={outfit}/>
											{typeof data.getData()['outfits'][outfit.getSource().name as string] === 'string' ?
												' (' + data.getData()['outfits'][outfit.getSource().name as string] + ')'
												: ''}
										</li>)}
								</ul>
							</>);
						});
				} else {
					setOutfits(<>
						<h2>Outfits</h2>
						The {data.displayName} has no outfits installed.
					</>);
				}
			});
		} else if (source.type === 'outfitter') {
			getData(source).then(data => {
				// todo: check the parent ship, I don't even remember how that works
				const outfits: string[] = Object.keys(data.getData() ?? {});
				if (outfits.includes('name')) {
					outfits.splice(outfits.indexOf('name'), 1);
				}
				if (outfits.length > 0) {
					Promise.all(outfits.map(outfit => getData(new ReferenceSource('outfit', outfit))))
						.then(outfitData => {
							setOutfits(<>
								<h2>Outfits</h2>
								Outfits sold here:
								<ul>
									{/*todo: use a table, and group by category*/}
									{outfitData.map(outfit =>
										<li key={outfit.getSource().name}>
											<ReferenceLink data={outfit}/>
										</li>)}
								</ul>
							</>);
						});
				} else {
					setOutfits(<>
						<h2>Outfits</h2>
						This outfitter doesn't sell any outfits.
					</>);
				}
			});
		}
	}
	return outfits;
}

export function ShipGenerator(source: ReferenceSource, title?: string) {
	let [ships, setShips] = useState(undefined as ReactElement | undefined);
	if (!ships) {
		if (source.type === 'outfit') {
			getReferences(source.type).then(references => {
				const myReferences: ReferenceSource[] = references[source.name as string] ?? [];
				const shipReferences: ReferenceSource[] = myReferences.filter(source => source.type === 'ship');
				if (shipReferences.length > 0) {
					Promise.all(shipReferences.map(source => getData(source))).then(ships => {
						setShips(<>
							<h2>Ships</h2>
							<details>
								<summary>This outfit is installed on {shipReferences.length} stock {shipReferences.length === 1 ? 'ship' : 'ships'}:</summary>
								<ul>
									{ships
										.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
										.map(ship =>
											<li key={ship.getSource().name}>
												<ReferenceLink data={ship}/>
											</li>
										)}
								</ul>
							</details>
						</>);
					});
				} else {
					setShips(<>
						<h2>Ships</h2>
						This outfit isn't installed on any ship.
					</>);
				}
			});
		} else if (source.type === 'shipyard') {
			getData(source).then(data => {
				const ships: string[] = Object.keys(data.getData() ?? {});
				if (ships.includes('name')) {
					ships.splice(ships.indexOf('name'), 1);
				}
				if (ships.length > 0) {
					Promise.all(ships.map(ship => getData(new ReferenceSource('ship', ship))))
						.then(shipData => {
							setShips(<>
								<h2>Ships</h2>
								Ships sold here:
								<ul>
									{/*todo: use a table, and group by category*/}
									{shipData.map(ship =>
										<li key={ship.getSource().name}>
											<ReferenceLink data={ship}/>
										</li>)}
								</ul>
							</>);
						});
				} else {
					setShips(<>
						<h2>Ships</h2>
						This shipyard doesn't sell any ships.
					</>);
				}
			});
		}
	}
	return ships;
}

export function OutfitterGenerator(source: ReferenceSource, title?: string) {
	let [outfitters, setOutfitters] = useState(undefined as ReactElement | undefined);
	if (!outfitters) {
		if (source.type === 'outfit') {
			getReferences(source.type).then(references => {
				const myReferences: ReferenceSource[] = references[source.name as string] ?? [];
				const outfitterReferences: ReferenceSource[] = myReferences.filter(source => source.type === 'outfitter');
				if (outfitterReferences.length > 0) {
					Promise.all(outfitterReferences.map(source => getData(source))).then(outfitters => {
						setOutfitters(<>
							<h2>Outfitters</h2>
							This outfit is sold in the following outfitters:
							<ul>
								{outfitters
									.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
									.map(data =>
										<li key={data.getSource().name}>
											<ReferenceLink data={data}/>
										</li>)}
							</ul>
						</>)
					});
				} else {
					setOutfitters(<>
						<h2>Outfitters</h2>
						This outfit isn't sold by any outfitters.
					</>)
				}
			})
		} else if (source.type === 'planet') {
			getData(source).then(data => {
				let myOutfitters: string | string[] = data.getData()['outfitter'] ?? [];
				if (typeof myOutfitters === 'string') {
					myOutfitters = [myOutfitters];
				}
				if (myOutfitters.length > 0) {
					Promise.all(myOutfitters.map(outfitter => getData(new ReferenceSource('outfitter', outfitter)))).then(outfitters => {
						setOutfitters(<>
							<h2>Outfitters</h2>
							This planet has the following outfitters available:
							<ul>
								{outfitters
									.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
									.map(data =>
										<li key={data.getSource().name}>
											<ReferenceLink data={data}/>
										</li>)
								}
							</ul>
						</>);
					});
				} else {
					setOutfitters(<>
						<h2>Outfitters</h2>
						This planet doesn't have any outfitters.
					</>)
				}
			});
		}
	}
	return outfitters;
}

export function ShipyardGenerator(source: ReferenceSource, title?: string) {
	let [shipyards, setShipyards] = useState(undefined as ReactElement | undefined);
	if (!shipyards) {
		if (source.type === 'ship') {
			getReferences(source.type).then(references => {
				const myReferences: ReferenceSource[] = references[source.name as string] ?? [];
				const shipyardReferences: ReferenceSource[] = myReferences.filter(source => source.type === 'shipyard');
				if (shipyardReferences.length > 0) {
					Promise.all(shipyardReferences.map(source => getData(source))).then(shipyards => {
						setShipyards(<>
							<h2>Shipyards</h2>
							This ship is sold in the following shipyards:
							<ul>
								{shipyards
									.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
									.map(data =>
										<li key={data.getSource().name}>
											<ReferenceLink data={data}/>
										</li>)}
							</ul>
						</>)
					});
				} else {
					setShipyards(<>
						<h2>Shipyards</h2>
						This ship isn't sold by any shipyards.
					</>)
				}
			})
		} else if (source.type === 'planet') {
			getData(source).then(data => {
				let myShipyards: string | string[] = data.getData()['shipyard'] ?? [];
				if (typeof myShipyards === 'string') {
					myShipyards = [myShipyards];
				}
				if (myShipyards.length > 0) {
					Promise.all(myShipyards.map(shipyard => getData(new ReferenceSource('shipyard', shipyard)))).then(shipyards => {
						setShipyards(<>
							<h2>Shipyards</h2>
							This planet has the following shipyards available:
							<ul>
								{shipyards
									.toSorted((a, b) => a.displayName.localeCompare(b.displayName))
									.map(data =>
										<li key={data.getSource().name}>
											<ReferenceLink data={data}/>
										</li>)
								}
							</ul>
						</>);
					});
				} else {
					setShipyards(<>
						<h2>Shipyards</h2>
						This planet doesn't have any shipyards.
					</>)
				}
			});
		}
	}
	return shipyards;
}

export function VariantListGenerator(source: ReferenceSource, title?: string) {
	let [variants, setVariants] = useState(undefined as ReactElement | undefined);
	if (!variants) {
		if (source.type === 'ship') {
			getReferences(source.type).then(references => {
				let myReferences: ReferenceSource[] | undefined = references[source.name as string];
				if (myReferences) {
					myReferences = myReferences.filter(reference => reference.type === 'ship');
					if (myReferences.length > 0) {
						variants = <>
							<h2>Variants</h2>
							<details>
								<summary>This ship has the following variants:</summary>
								<ul>
									{/*todo: look up the display name of the references, maybe a custom component?*/}
									{myReferences
										.sort((a, b) => (a.name as string).localeCompare(b.name as string))
										.map(reference =>
											<li key={reference.name}>
												<a href={toURL(reference).toString()}>{reference.name}</a>
											</li>)}
								</ul>
							</details>
						</>
						setVariants(variants);
					}
				}
			});
		}
	}
	return variants;
}

export function TriviaGenerator(source: ReferenceSource, title?: string) {
	let [changelogEntries, setChangelogEntries] = useState(new Array<ChangeData>());
	let [data, setData] = useState(undefined as ObjectData | undefined);

	if (changelogEntries.length === 0) {
		getChangelog(source).then(changelog => setChangelogEntries(changelog));
	}
	if (!data) {
		getData(source).then(data => setData(data));
	}

	const components: Array<ReactElement> = new Array<React.ReactElement>();
	components.push(<h2 key='header'>Trivia</h2>);
	if (changelogEntries.length > 0) {
		components.push(<h4 key='history'>History</h4>);
		components.push(<details className="changelog" key='changelog'>
			<summary>
				List of changes
			</summary>
			{data ?
				<p>
					View the current state in the <a href={getInteractiveFileURL(data.getLocation().filename, data.getLocation().line, data.getLastCommit()).toString()}>game data</a>.
				</p>
				: undefined}
			{changelogEntries.toReversed().map(entry =>
				<details key={entry.commit.hash}>
					<summary>
						{entry.diff.added ? <span className="text-success">(added) </span> : undefined}
						{entry.diff.removed ? <span className="text-danger">(removed) </span> : undefined}
						{(!entry.diff.removed && !entry.diff.added) ?
							<span className="text-info">(edited) </span> : undefined}
						<span style={{fontStyle: "italic"}}>{entry.commit.author}</span>
						{": " + entry.commit.message + ' '}
						<a href={getCommitURL(entry.commit.hash).toString()}>(view commit)</a>
					</summary>
					<Patch diffData={entry.diff}/>
				</details>
			)}
		</details>);
	}

	return components.length > 1 ? components : undefined;
}

export default WikiPage;