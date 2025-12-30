/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import {
	getLicenseName,
	getParts,
	isLicense,
	isMultiPart,
	ReferenceSource,
	typeToString
} from "../data/ReferenceSource.ts";
import React, {ReactElement, useState} from "react";
import {
	getChangelog,
	getCommitURL,
	getData,
	getDisplayName,
	getInteractiveFileURL,
	getReferences
} from "../data/DataFetcher.ts";
import {ObjectData} from '../data/ObjectData.ts'
import {findSource} from "../utils.ts";
import {Alert} from "react-bootstrap";
import {CommitData} from "../data/CommitData.ts";
import {ChangeData} from "../data/ChangeData.ts";
import {ReferenceLink, ReferenceLinkList} from "../components/ReferenceLink.tsx";
import {Changelog} from "../components/Changelog.tsx";
import {StatBox} from "../components/StatBox.tsx";
import {GoHome} from "../components/GoHome.tsx";
import {ComparisonSingleItemNavigation} from "../components/ComparisonNavigation.tsx";

export type SectionGenerator = (source: ReferenceSource, title?: string) => Element | Element[] | ReactElement | ReactElement[] | undefined | null;

export class PageGenerator {
	title?: SectionGenerator = TitleGenerator;
	stats?: SectionGenerator = StatsGenerator;
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
	fleets?: SectionGenerator = FleetListGenerator;
	trivia?: SectionGenerator = TriviaGenerator;

	static empty(): PageGenerator
	{
		const gen = new PageGenerator();
		gen.stats = undefined;
		gen.description = undefined;
		gen.landingLocations = undefined;
		gen.links = undefined;
		gen.location = undefined;
		gen.outfits = undefined;
		gen.ships = undefined;
		gen.outfitters = undefined;
		gen.shipyards = undefined;
		gen.variants = undefined;
		gen.fleets = undefined;
		gen.trivia = undefined;
		return gen;
	}
}

export const CUSTOM_PAGE_GENERATORS = new Map<ReferenceSource, PageGenerator>();

type SourceProps = { source: ReferenceSource, title?: string };

function WikiPage(props: SourceProps) {
	const mappedSource: ReferenceSource | null = findSource(props.source, CUSTOM_PAGE_GENERATORS.keys());
	const generator = mappedSource ? CUSTOM_PAGE_GENERATORS.get(mappedSource) as PageGenerator : new PageGenerator();

	const [titleSet, setTitleSet] = useState(false);
	if (!titleSet) {
		setTitleSet(true);
		if (props.title) {
			document.title = props.title + " | " + document.title;
		} else {
			getDisplayName(props.source).then(name => {
				document.title = name + " | " + document.title;
			});
		}
	}

	return <>
		{generator.title ? generator.title.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.stats ? generator.stats.call(generator, props.source, props.title) ?? <></> : <></>}
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
		{generator.fleets ? generator.fleets.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.trivia ? generator.trivia.call(generator, props.source, props.title) ?? <></> : <></>}
	</>;
}

export function TitleGenerator(source: ReferenceSource, title?: string) {
	let [heading, setHeading] = useState(undefined as ReactElement | undefined);
	if (!heading) {
		if (title) {
			setHeading(<h1>{title}</h1>);
		} else {
			getDisplayName(source).then(displayName => {
				setHeading(
					<>
						<h1>{displayName}</h1>
						{displayName === source.name ? <></>
							: <><small style={{fontStyle: "italic"}}>Internally: {source.name}</small><br/></>}
					</>);
			}).catch(() => {
				setHeading(GoHome());
			});
		}
	}

	let [removedNotice, setRemovedNotice] = useState(undefined as ReactElement | undefined);
	if (!removedNotice && !title) {
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
	const stubTypes: string[] = ["system", "government", "minable"];
	if (!title && (stubTypes.includes(source.type) || isMultiPart(source))) {
		stubNotice = <Alert variant="warning">
			This article is automatically generated and is a stub. You can read about how to expand it <a href='/public'>here: todo</a>.
		</Alert>
	}

	return <section>
		{heading}
		{removedNotice}
		{stubNotice}
	</section>
}

export function PreambleGenerator(source: ReferenceSource, title?: string) {
	let [preamble, setPreamble] = useState(undefined as ReactElement | undefined);
	if (!preamble) {
		getChangelog(source).then(changelog => {
			if (changelog.length) {
				getDisplayName(source).then(displayName => {
					const typeText = isLicense(source) ? 'license' : typeToString(source);
					preamble = <section>
						<span>
							{displayName + " is " + (typeText.match('^[aeiouAEIOU].*') ? 'an' : 'a') + ' ' + typeText + " "}
							<a href={getCommitURL(changelog[0].commit.hash).toString()}>added</a>
							{" to the game in " + changelog[0].commit.tag + "."}
						</span>
					</section>;
					setPreamble(preamble);
				});
			} else {
				console.log('No changelog found');
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
				description = <section>
					<h2>Description</h2>
					{(typeof desc === 'string') ? <p>{desc}</p> : (desc as any[]).map(text => {
							if (text.name) {
								return <p key={text.name} style={{fontStyle: "italic"}} title='This text is not always displayed in-game.'>{text.name}</p>
							} else {
								return <p key={text}>{text}</p>;
							}
						}
					)}
				</section>;
				setDescription(description);
			}
		});
	}
	return description;
}

export function StatsGenerator(source: ReferenceSource, title?: string) {
	return <div className='side-stat-box'>
		<StatBox elements={[source]}/>
		{(source.type === 'ship' || source.type === 'outfit') ? <ComparisonSingleItemNavigation source={source}/> : <></>}
	</div>
}

export function LandingLocationGenerator(source: ReferenceSource, title?: string) {
	let [planets, setPlanets] = useState(undefined as ReactElement | undefined);

	function toDataArray(data: any | any[] | undefined): any[] {
		if (!data) {
			return [];
		} else if (Array.isArray(data)) {
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
				setPlanets(<section>
					<h2>Landing locations</h2>
					<ReferenceLinkList sources={landableArray.map(name => new ReferenceSource('planet', name))}
									   title={data.displayName + ' has ' + landableArray.length + ' landing ' + (landableArray.length === 1 ? 'location' : 'locations') + ':'}/>
				</section>)
			} else {
				setPlanets(<section>
					<h2>Landing locations</h2>
					{data.displayName} doesn't have any landing locations.
				</section>);
			}
		});
	}

	return planets;
}

export function LinkGenerator(source: ReferenceSource, title?: string) {
	let [links, setLinks] = useState(undefined as ReactElement | undefined);
	let [wormholes, setWormholes] = useState(undefined as ReactElement | undefined);
	if (!links && source.type === 'system') {
		getData(source).then(data => {
			const dataLinks: string | string[] | undefined = data.getData()['link'];
			if (dataLinks) {
				const linkArray: string[] = typeof dataLinks === 'string' ? [dataLinks] : (dataLinks as string[]);
				setLinks(<section>
					<h2>Links</h2>
					<ReferenceLinkList sources={linkArray.map(link => new ReferenceSource('system', link))}
									   title={<>{data.displayName} links to {linkArray.length === 1 ? '1 system' : linkArray.length + ' systems'}:</>}/>
				</section>);
			} else {
				setLinks(<section>
					<h2>Links</h2>
					{data.displayName} isn't linked to any systems.
				</section>);
			}
		});
	}
	if (!wormholes && source.type === 'system') {
		getReferences(source.type).then(references => {
			let myReferences: ReferenceSource[] = references[source.name as string] ?? [];
			if (myReferences) {
				myReferences = myReferences.filter(reference => reference.type === 'wormhole');
				if(myReferences.length > 0) {
					Promise.all(myReferences.map(wormhole => getData(wormhole))).then(wormholes => {
						const from: string[] = [];
						const to: string[] = [];

						for (const wormhole of wormholes) {
							const dataLinks = wormhole.getData().link;
							if(dataLinks) {
								const linkArray: any[] = Array.isArray(dataLinks) ? (dataLinks as any[]) : [dataLinks];
								for (const link of linkArray) {
									if(link.name === source.name) {
										link.values?.forEach((value: string) => to.push(value));
									}
									else if(link.values && link.values.includes(source.name)) {
										from.push(link.name);
									}
								}
							}
						}
						setWormholes(<>
							{
								from.length === 0 ? undefined :
									<>Incoming wormholes from:
										<ReferenceLinkList sources={from.map(s=>new ReferenceSource('system', s))}/>
									</>
							}
							{
								from.length === 0 ? undefined :
									<>Outgoing wormholes to:
										<ReferenceLinkList sources={to.map(s=>new ReferenceSource('system', s))}/>
									</>
							}
						</>);
					});
				} else {
					setWormholes(<></>);
				}
			} else {
				setWormholes(<></>);
			}
		});
	}

	return <>{links}{wormholes}</>;
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
							setLocation(<section>
								<h2>Location</h2>
								<ReferenceLinkList sources={myReferences} title='This fleet can appear in the following systems:'/>
							</section>);
						} else {
							setLocation(<section>
								<h2>Location</h2>
								This fleet doesn't appear in any system.
							</section>);
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
						setLocation(<section>
							<h2>Location</h2>
							{planets.length === 0 ?
								<p>There are no planets directly belonging to this government.</p> :
								<ReferenceLinkList sources={planets} title='The following planets are assigned to this government:'/>
							}
							{systems.length === 0 ?
								<p>There are no systems directly belonging to this government.</p> :
								<ReferenceLinkList sources={systems} title='The following systems are assigned to this government:'/>
							}
						</section>);
					} else {
						setLocation(<section>
							<h2>Location</h2>
							There are no systems or planets belonging to this government.
						</section>)
					}
				});
				break;
			case 'minable':
				getReferences(source.type).then(references => {
					const myReferences: ReferenceSource[] = references[source.name as string] ?? [];
					const systems: ReferenceSource[] = myReferences.filter(source => source.type === 'system');
					if (systems.length > 0) {
						setLocation(<section>
							<h2>Location</h2>
							<ReferenceLinkList sources={systems} title='This minable appears in the following systems:'/>
						</section>);
					} else {
						setLocation(<section>
							<h2>Location</h2>
							This minable doesn't appear in any system.
						</section>);
					}
				});
				break;
			case 'outfitter':
			case 'shipyard':
				getReferences(source.type).then(references => {
					getData(source).then(data => {
						const myReferences: ReferenceSource[] = references[source.name as string] ?? [];
						const planets: ReferenceSource[] = myReferences.filter(source => source.type === 'planet');
						let conditional;
						if (Object.keys(data.getData()).includes('location')) {
							conditional = <p>This {source.type} may appear on other planets conditionally.</p>
						}
						if (planets.length > 0) {
							setLocation(<section>
								<h2>Location</h2>
								<ReferenceLinkList sources={planets} title={<>This {source.type} appears on {planets.length === 1 ? '1 planet' : planets.length + ' planets'}:</>}/>
								{conditional}
							</section>);
						} else {
							setLocation(<section>
								<h2>Location</h2>
								This {source.type} doesn't appear on any planets.
								{conditional}
							</section>);
						}
					});
				});
				break;
			case 'planet':
				getReferences(source.type).then(references => {
					const myReferences = references[source.name as string] ?? [];
					const systems: ReferenceSource[] = myReferences.filter(source => source.type === 'system');
					Promise.all(systems.map(system => getDisplayName(system))).then(systemNames => {
						setLocation(<section>
							<h2>Location</h2>
							{systems.length === 0 ?
								<>This planet doesn't appear in any system.</> :
								(systems.length === 1 ?
									<>This planet appears in the <ReferenceLink source={systems[0]} displayName={systemNames[0]}/> system.</> :
									<>This wormhole connects the <ReferenceLink source={systems[0]} displayName={systemNames[0]}/> and <ReferenceLink source={systems[1]} displayName={systemNames[1]}/> systems.</>)}
						</section>);
					})

				});
				break;
		}
	}
	return location;
}

export function OutfitGenerator(source: ReferenceSource, title?: string) {
	let [outfits, setOutfits] = useState(undefined as ReactElement | undefined | null);
	if (outfits === undefined) {
		if (source.type === 'ship') {
			getData(source).then(data => {
				// todo: check the parent ship, I don't even remember how that works
				const outfits: string[] = Object.keys(data.getData()['outfits'] ?? {});
				if (outfits.length > 0) {
					setOutfits(<section>
						<h2>Outfits</h2>
						<ReferenceLinkList
							sources={outfits.map(outfit => new ReferenceSource('outfit', outfit))}
							categoryType='outfit'
							counts={outfits.map(outfit => data.getData()['outfits'][outfit])}
							title={<>The {data.displayName} has the following outfits installed:</>}/>
					</section>);
				} else {
					setOutfits(<section>
						<h2>Outfits</h2>
						The {data.displayName} has no outfits installed.
					</section>);
				}
			});
		} else if (source.type === 'outfitter') {
			getData(source).then(data => {
				const blacklist = ['name', 'location', 'stock', 'to sell'];
				let outfits: string[] = Object.keys(data.getData() ?? {});
				outfits = outfits.filter(outfit => !blacklist.includes(outfit));
				setOutfits(<section>
						<h2>Outfits</h2>
						{outfits.length > 0 ?
							<ReferenceLinkList sources={outfits.map(outfit => new ReferenceSource('outfit', outfit))} categoryType={'outfit'} title='Outfits sold here:'/>
							: "This outfitter doesn't sell any outfits."}
						{['location', 'stock'].some(key => data.getData()[key]) ?
							<p>This outfitter may sell other outfits conditionally.</p>
							: undefined}
					</section>
				);
			});
		} else if (isMultiPart(source) && getParts(source)[0] === 'category') {
			getReferences(source.type).then(references => {
				const myReferences = references[source.name as string] ?? [];
				const outfitReferences = myReferences.filter(ref => ref.type === 'outfit');
				if (outfitReferences.length > 0) {
					setOutfits(<section>
						<h2>Outfits</h2>
						<ReferenceLinkList sources={myReferences} categoryType='outfit' title='This category contains the following outfits:'/>
					</section>);
				} else {
					setOutfits(null);
				}
			});
		} else if (isLicense(source)) {
			getReferences('license').then(references => {
				const myReferences = references[getLicenseName(source)] ?? [];
				const outfitReferences = myReferences.filter(ref => ref.type === 'outfit' && ref.name !== source.name);
				if (outfitReferences.length > 0) {
					setOutfits(<section>
						<h2>Outfits</h2>
						<ReferenceLinkList sources={myReferences} categoryType='outfit' title='This license is required to purchase the following outfits:'/>
					</section>);
				} else {
					setOutfits(<section>
						<h2>Outfits</h2>
						This license isn't required to purchase any outfits.
					</section>);
				}
			});
		}
	}
	return outfits;
}

export function ShipGenerator(source: ReferenceSource, title?: string) {
	let [ships, setShips] = useState(undefined as ReactElement | undefined | null);
	if (ships === undefined) {
		if (source.type === 'outfit') {
			getReferences(isLicense(source) ? 'license' : source.type).then(references => {
				const myReferences: ReferenceSource[] = references[isLicense(source) ? getLicenseName(source) : source.name as string] ?? [];
				const shipReferences: ReferenceSource[] = myReferences.filter(source => source.type === 'ship')
				if (isLicense(source)) {
					if (shipReferences.length > 0) {
						setShips(<section>
							<h2>Ships</h2>
							<ReferenceLinkList sources={shipReferences} categoryType='ship' title='This license is required to purchase the following ships:'/>
						</section>);
					} else {
						setShips(<section>
							<h2>Ships</h2>
							This license isn't required to purchase any ships.
						</section>);
					}
				} else {
					if (shipReferences.length > 0) {
						setShips(<section>
							<h2>Ships</h2>
							<ReferenceLinkList sources={shipReferences} categoryType='ship' title={<>This outfit is installed on {shipReferences.length} stock {shipReferences.length === 1 ? 'ship' : 'ships'}:</>}/>
						</section>);
					} else {
						setShips(<section>
							<h2>Ships</h2>
							This outfit isn't installed on any ship.
						</section>);
					}
				}
			});
		} else if (source.type === 'shipyard') {
			getData(source).then(data => {
				const blacklist = ['name', 'location', 'stock', 'to sell'];
				let ships: string[] = Object.keys(data.getData() ?? {});
				ships = ships.filter(outfit => !blacklist.includes(outfit));
				setShips(<section>
						<h2>Ships</h2>
						{ships.length > 0 ?
							<ReferenceLinkList sources={ships.map(ship => new ReferenceSource('ship', ship))} categoryType='ship' title='Ships sold here:'/>
							: "This shipyard doesn't sell any ships."}
						{['location', 'stock', 'to sell'].some(key => data.getData()[key]) ?
							<p>This shipyard may sell other ships conditionally.</p>
							: undefined}
					</section>
				);
			});
		} else if (source.type === 'fleet') {
			getData(source).then(data => {
				const variantArray = [].concat(data.getData()['variant'] ?? []);
				if (variantArray.length > 0) {
					setShips(<section>
						<h2>Ships</h2>
						This fleet has the following variants:
						{variantArray.map((variant, index) =>
							<ReferenceLinkList key={index.toString()}
											   sources={Object.keys(variant).filter(s => s !== 'name').map(ship => new ReferenceSource('ship', ship))}
											   counts={Object.keys(variant).filter(s => s !== 'name').map(ship => (typeof (variant[ship]) === 'string' ? Number.parseInt(variant[ship]) : 1))}
							/>
						)}
					</section>);
				} else {
					setShips(<section>
						<h2>Ships</h2>
						This fleet doesn't have any ships.
					</section>);
				}
			});
		} else if (isMultiPart(source) && getParts(source)[0] === 'category') {
			getReferences(source.type).then(references => {
				const myReferences = references[source.name as string] ?? [];
				let shipReferences = myReferences.filter(ref => ref.type === 'ship');
				if (shipReferences.length > 0) {
					setShips(<section>
						<h2>Ships</h2>
						<ReferenceLinkList sources={myReferences} categoryType={getParts(source)[1] === 'ship' ? undefined : 'ship'}
										   title={getParts(source)[1] === 'bay type' ?
											   'Ships with bays of this type:' :
											   'This category contains the following ships:'}/>
					</section>);
				} else {
					setShips(null);
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
			if (isLicense(source)) {
				setOutfitters(<></>);
			} else {
				getReferences(source.type).then(references => {
					const myReferences: ReferenceSource[] = references[source.name as string] ?? [];
					const outfitterReferences: ReferenceSource[] = myReferences.filter(source => source.type === 'outfitter');
					if (outfitterReferences.length > 0) {
						setOutfitters(<section>
							<h2>Outfitters</h2>
							<ReferenceLinkList sources={outfitterReferences} title='This outfit is sold in the following outfitters:'/>
						</section>)
					} else {
						setOutfitters(<section>
							<h2>Outfitters</h2>
							This outfit isn't sold by any outfitters.
						</section>)
					}
				});
			}
		} else if (source.type === 'planet') {
			getData(source).then(data => {
				let myOutfitters: string | string[] = data.getData()['outfitter'] ?? [];
				if (typeof myOutfitters === 'string') {
					myOutfitters = [myOutfitters];
				}
				if (myOutfitters.length > 0) {
					setOutfitters(<section>
						<h2>Outfitters</h2>
						<ReferenceLinkList sources={myOutfitters.map(outfitter => new ReferenceSource('outfitter', outfitter))} title='This planet has the following outfitters available:'/>
					</section>);
				} else {
					setOutfitters(<section>
						<h2>Outfitters</h2>
						This planet doesn't have any outfitters.
					</section>)
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
					setShipyards(<section>
						<h2>Shipyards</h2>
						<ReferenceLinkList sources={shipyardReferences} title='This ship is sold in the following shipyards:'/>
					</section>)
				} else {
					setShipyards(<section>
						<h2>Shipyards</h2>
						This ship isn't sold by any shipyards.
					</section>)
				}
			})
		} else if (source.type === 'planet') {
			getData(source).then(data => {
				let myShipyards: string | string[] = data.getData()['shipyard'] ?? [];
				if (typeof myShipyards === 'string') {
					myShipyards = [myShipyards];
				}
				if (myShipyards.length > 0) {
					setShipyards(<section>
						<h2>Shipyards</h2>
						<ReferenceLinkList sources={myShipyards.map(shipyard => new ReferenceSource('shipyard', shipyard))} title='This planet has the following shipyards available:'/>
					</section>);
				} else {
					setShipyards(<section>
						<h2>Shipyards</h2>
						This planet doesn't have any shipyards.
					</section>)
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
						setVariants(<section>
							<h2>Variants</h2>
							<ReferenceLinkList sources={myReferences} title='This ship has the following variants:'/>
						</section>);
					}
				}
			});
		}
	}
	return variants;
}

export function FleetListGenerator(source: ReferenceSource, title?: string) {
	let [fleets, setFleets] = useState(undefined as ReactElement | undefined);

	if (!fleets) {
		switch (source.type) {
			case 'system':
				getData(source).then(data => {
					const myFleets: any[] = [].concat(data.getData()['fleet'] ?? []);
					setFleets(<section>
						<h2>Fleets</h2>
						{myFleets.length > 0 ?
							<ReferenceLinkList sources={myFleets.map(fleet => new ReferenceSource('fleet', fleet['name']))} title='The following fleets appear in this system naturally:'/>
							: <>No fleets appear in this system naturally.</>}
					</section>);
				})
				break;
			case 'ship':
				getReferences(source.type).then(references => {
					const myReferences = references[source.name as string] ?? [];
					const myFleets = myReferences.filter(source => source.type === 'fleet');
					setFleets(<section>
						<h2>Fleets</h2>
						{myFleets.length > 0 ?
							<ReferenceLinkList sources={myFleets} title='This ship appears in the following fleets:'/>
							: <>This ship doesn't appear in any fleet.</>}
					</section>);
				});
		}
	}
	return fleets;
}

export function TriviaGenerator(source: ReferenceSource, title?: string) {
	let [changelogEntries, setChangelogEntries] = useState(new Array<ChangeData>());
	let [data, setData] = useState(undefined as ObjectData | undefined);

	if (isMultiPart(source)) {
		return undefined;
	}

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
			<Changelog entries={changelogEntries.toReversed()}/>
		</details>);
	}

	return components.length > 1 ? <section>{components}</section> : undefined;
}

export default WikiPage;