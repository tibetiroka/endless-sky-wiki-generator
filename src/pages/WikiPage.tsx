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
	getAllReferences,
	getLicenseName,
	getParts,
	isLicense,
	isMultiPart,
	ReferenceSource,
	toString,
	typeToString
} from "../data/ReferenceSource.ts";
import React, {ReactElement, useEffect, useState} from "react";
import {
	getAllRawData,
	getChangelog,
	getCommitURL,
	getData,
	getDisplayName,
	getInteractiveFileURL,
	getParsedData,
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
import {
	ConditionalText,
	Fleet,
	getAllReferenceObjects,
	Government, Outfit,
	Planet,
	Ship,
	Shop,
	System,
	Wormhole
} from "../data/DataScheme.tsx";
import {MapItemNavigation} from "../components/MapNavigator.tsx";
import Giscus from "@giscus/react";

export type SectionGenerator = (source: ReferenceSource, title?: string) => Element | Element[] | ReactElement | ReactElement[] | undefined | null;

export class PageGenerator {
	title?: SectionGenerator = TitleGenerator;
	stats?: SectionGenerator = StatsGenerator;
	preamble?: SectionGenerator = PreambleGenerator;
	description?: SectionGenerator = DescriptionGenerator;
	spaceport?: SectionGenerator = SpaceportGenerator;
	landingLocations?: SectionGenerator = LandingLocationGenerator;
	links?: SectionGenerator = LinkGenerator;
	location?: SectionGenerator = LocationGenerator;
	licenses?: SectionGenerator = LicenseGenerator;
	outfits?: SectionGenerator = OutfitGenerator;
	ships?: SectionGenerator = ShipGenerator;
	outfitters?: SectionGenerator = OutfitterGenerator;
	shipyards?: SectionGenerator = ShipyardGenerator;
	variants?: SectionGenerator = VariantListGenerator;
	fleets?: SectionGenerator = FleetListGenerator;
	trivia?: SectionGenerator = TriviaGenerator;
	discussion?: SectionGenerator = DiscussionGenerator;

	static empty(): PageGenerator {
		const gen = new PageGenerator();
		gen.stats = undefined;
		gen.description = undefined;
		gen.spaceport = undefined;
		gen.landingLocations = undefined;
		gen.links = undefined;
		gen.location = undefined;
		gen.licenses = undefined;
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
		{generator.spaceport ? generator.spaceport.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.landingLocations ? generator.landingLocations.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.links ? generator.links.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.location ? generator.location.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.licenses ? generator.licenses.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.outfits ? generator.outfits.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.ships ? generator.ships.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.outfitters ? generator.outfitters.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.shipyards ? generator.shipyards.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.variants ? generator.variants.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.fleets ? generator.fleets.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.trivia ? generator.trivia.call(generator, props.source, props.title) ?? <></> : <></>}
		{generator.discussion ? generator.discussion.call(generator, props.source, props.title) ?? <></> : <></>}
	</>;
}

export function TitleGenerator(source: ReferenceSource, title?: string) {
	let [heading, setHeading] = useState(undefined as ReactElement | undefined);
	if (!heading) {
		if (title) {
			document.getElementById('meta-og-title')?.setAttribute('content', title);
			setHeading(<>
				<h1>{title}</h1>
			</>);
		} else {
			document.getElementById('meta-og-title')?.setAttribute('content', toString(source));
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
		getParsedData(source).then(data => {
			const desc = (data as any).description;
			if (desc) {
				setDescription(<section>
					<h2>Description</h2>
					{
						(typeof desc === 'string') ? <p>{desc}</p> : (desc as ConditionalText).toElement()
					}
				</section>);
			} else {
				setDescription(<></>);
			}
		});
	}
	return description;
}

export function SpaceportGenerator(source: ReferenceSource, title?: string) {
	let [spaceport, setSpaceport] = useState(undefined as ReactElement | undefined);
	if (!spaceport && source.type === 'planet') {
		getParsedData(source).then(data => {
			const planet: Planet = data as Planet;
			setSpaceport(<section>
				<h2>Spaceport</h2>
				{
					planet.spaceport.toElement()
				}
			</section>);
		});
	}
	return spaceport;
}

export function StatsGenerator(source: ReferenceSource, title?: string) {
	const [mapNavigation, setMapNavigation] = useState(undefined as ReactElement | undefined);

	useEffect(() => {
		if (source.type === 'planet') {
			getAllReferences(source, 'system').then(systems => {
				if (systems.length > 0) {
					setMapNavigation(<MapItemNavigation source={systems[0]} target={source}/>);
				}
			})
		} else if (source.type === 'system') {
			setMapNavigation(<MapItemNavigation source={source}/>);
		}
	}, [source]);

	return <div className='side-stat-box'>
		<StatBox elements={[source]}/>
		{(source.type === 'ship' || source.type === 'outfit') ?
			<ComparisonSingleItemNavigation source={source}/> : undefined}
		{mapNavigation}
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
		getParsedData(source).then(data => data as System).then(data => {
			if (data.links.length > 0) {
				setLinks(<section>
					<h2>Links</h2>
					<ReferenceLinkList sources={data.links.map(link => new ReferenceSource('system', link))}
									   title={<>{data.displayName} links to {data.links.length === 1 ? '1 system' : data.links.length + ' systems'}:</>}/>
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
		getAllReferenceObjects(source, 'wormhole').then(wormholes => wormholes as Wormhole[]).then(wormholes => {
			const from: string[] = [];
			const to: string[] = [];

			for (const wormhole of wormholes) {
				for (const link of wormhole.links) {
					if (link.from === source.name) {
						to.push(link.to);
					} else if (link.to === source.name) {
						from.push(link.from);
					}
				}
			}
			setWormholes(<>
				{
					from.length === 0 ? undefined :
						<>Incoming wormholes from:
							<ReferenceLinkList sources={from.map(s => new ReferenceSource('system', s))}/>
						</>
				}
				{
					from.length === 0 ? undefined :
						<>Outgoing wormholes to:
							<ReferenceLinkList sources={to.map(s => new ReferenceSource('system', s))}/>
						</>
				}
			</>);
		});
	}

	return <>{links}{wormholes}</>;
}

export function LocationGenerator(source: ReferenceSource, title?: string) {
	let [location, setLocation] = useState(undefined as ReactElement | undefined);
	if (!location) {
		switch (source.type) {
			case 'fleet':
				getAllReferences(source, 'system').then(references => {
					if (references.length > 0) {
						setLocation(<section>
							<h2>Location</h2>
							<ReferenceLinkList sources={references} title='This fleet can appear in the following systems:'/>
						</section>);
					} else {
						setLocation(<section>
							<h2>Location</h2>
							This fleet doesn't appear in any system.
						</section>);
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
				getAllReferences(source, 'system').then(systems => {
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
				getAllReferences(source, 'planet').then(planets => {
					getParsedData(source).then(data => data as Shop).then(data => {
						let conditional;
						if (data.hasLocationFilter) {
							conditional = <p>This {source.type} may appear on other planets conditionally.</p>
						}
						if (data.hasToSell) {
							conditional = <>{conditional}
								<p>This {source.type} might not be available at all times.</p></>
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
				getAllReferences(source, 'system').then(systems => {
					Promise.all(systems.map(system => getDisplayName(system))).then(systemNames => {
						setLocation(<section>
							<h2>Location</h2>
							{systems.length === 0 ?
								<>This planet doesn't appear in any system.</> :
								(systems.length === 1 ?
									<>This planet appears in the <ReferenceLink source={systems[0]} displayName={systemNames[0]}/> system.</> :
									<>This wormhole connects the <ReferenceLink source={systems[0]} displayName={systemNames[0]}/> and <ReferenceLink source={systems[1]} displayName={systemNames[1]}/> systems.</>)}
						</section>);
					});
				});
				break;
		}
	}
	return location;
}

export function LicenseGenerator(source: ReferenceSource, title?: string) {
	let [licenses, setLicenses] = useState(undefined as string[] | undefined);
	if (licenses === undefined) {
		switch (source.type) {
			case 'ship':
				getParsedData(source).then(ship => setLicenses((ship as Ship).licenses()));
				break;
			case 'outfit':
				getParsedData(source).then(outfit => setLicenses((outfit as Outfit).licenses));
				break;
		}
	}
	console.log(licenses);
	if(licenses && licenses.length > 0) {
		return <section>
			<h2>Licenses</h2>
			<ReferenceLinkList sources={licenses.map(l=> new ReferenceSource('outfit', l + ' License'))} title={'The following licenses are required to purchase this ' + source.type + ':'}/>
		</section>
	}
	return undefined;
}

export function OutfitGenerator(source: ReferenceSource, title?: string) {
	let [outfits, setOutfits] = useState(undefined as ReactElement | undefined | null);
	if (outfits === undefined) {
		if (source.type === 'ship') {
			getParsedData(source).then(data => data as Ship).then(data => {
				if (data.outfits.length > 0) {
					setOutfits(<section>
						<h2>Outfits</h2>
						<ReferenceLinkList
							sources={data.outfits.map(outfit => new ReferenceSource('outfit', outfit.name))}
							categoryType='outfit'
							counts={data.outfits.map(outfit => outfit.count)}
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
			getParsedData(source).then(data => data as Shop).then(data => {
				setOutfits(<section>
						<h2>Outfits</h2>
						{data.stock.length > 0 ?
							<ReferenceLinkList sources={data.stock.map(outfit => new ReferenceSource('outfit', outfit))} categoryType={'outfit'} title='Outfits sold here:'/>
							: "This outfitter doesn't sell any outfits."}
					</section>
				);
			});
		} else if (source.type === 'government') {
			getParsedData(source).then(data => data as Government).then(data => {
				getAllRawData('outfit').then(outfits => {
						const govOutfits = outfits.values().filter(object => {
							const parts = object.getLocation().filename.split('/');
							return parts[parts.length - 1].startsWith((source.name as string).toLowerCase());
						}).toArray();
						if (govOutfits.length === 0) {
							setOutfits(<></>);
						} else {
							setOutfits(<section>
								<h2>Outfits</h2>
								<ReferenceLinkList sources={govOutfits.map(outfit => outfit.getSource())} categoryType='outfit' title='Outfits belonging to this government:'/>
								<small><i>This list may be incorrect or incomplete. The game doesn't assign outfits to governments; anything shown here is a guess based on the names and locations of data files. It may also include outfits belonging to other governments which are used in missions in this faction's campaign.</i></small>
							</section>);
						}
					}
				);
			});
		} else if (isMultiPart(source) && getParts(source)[0] === 'category') {
			getAllReferences(source, 'outfit').then(references => {
				if (references.length > 0) {
					setOutfits(<section>
						<h2>Outfits</h2>
						<ReferenceLinkList sources={references} categoryType='outfit' title='This category contains the following outfits:'/>
					</section>);
				} else {
					setOutfits(null);
				}
			});
		} else if (isLicense(source)) {
			getAllReferences(new ReferenceSource('license', getLicenseName(source)), 'outfit').then(myReferences => {
				const outfitReferences = myReferences.filter(ref => ref.name !== source.name);
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
			getAllReferences(new ReferenceSource(isLicense(source) ? 'license' : source.type, isLicense(source) ? getLicenseName(source) : source.name), 'ship').then(shipReferences => {
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
			getParsedData(source).then(data => data as Shop).then(data => {
				setShips(<section>
						<h2>Ships</h2>
						{data.stock.length > 0 ?
							<ReferenceLinkList sources={data.stock.map(ship => new ReferenceSource('ship', ship))} categoryType='ship' title='Ships sold here:'/>
							: "This shipyard doesn't sell any ships."}
					</section>
				);
			});
		} else if (source.type === 'fleet') {
			getParsedData(source).then(data => data as Fleet).then(data => {
				if (data.variants.length > 0) {
					setShips(<section>
						<h2>Ships</h2>
						This fleet has the following variants:
						{data.variants.map((variant, index) =>
							<ReferenceLinkList key={index.toString()}
											   sources={variant.map(ship => new ReferenceSource('ship', ship.name))}
											   counts={variant.map(ship => ship.count)}
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
		} else if (source.type === 'government') {
			getParsedData(source).then(data => data as Government).then(data => {
				getAllRawData('ship').then(ships => {
						const govShips = ships.values().filter(object => {
							const parts = object.getLocation().filename.split('/');
							return parts[parts.length - 1].startsWith((source.name as string).toLowerCase());
						}).toArray();
						if (govShips.length === 0) {
							setShips(<></>);
						} else {
							setShips(<section>
								<h2>Ships</h2>
								<ReferenceLinkList sources={govShips.map(ship => ship.getSource())} categoryType='ship' title='Ships belonging to this government:'/>
								<small><i>This list may be incorrect or incomplete. The game doesn't assign ships to governments; anything shown here is a guess based on the names and locations of data files. It may also include ships belonging to other governments which are used in missions in this faction's campaign.</i></small>
							</section>);
						}
					}
				);
			});
		} else if (isMultiPart(source) && getParts(source)[0] === 'category') {
			getAllReferences(source, 'ship').then(shipReferences => {
				if (shipReferences.length > 0) {
					setShips(<section>
						<h2>Ships</h2>
						<ReferenceLinkList sources={shipReferences} categoryType={getParts(source)[1] === 'ship' ? undefined : 'ship'}
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
				getAllReferences(source, 'outfitter').then(outfitterReferences => {
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
			getParsedData(source).then(data => data as Planet).then(data => {
				if (data.outfitter.length > 0) {
					setOutfitters(<section>
						<h2>Outfitters</h2>
						<ReferenceLinkList sources={data.outfitter.map(outfitter => new ReferenceSource('outfitter', outfitter))} title='This planet has the following outfitters available:'/>
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
			getAllReferences(source, 'shipyard').then(shipyardReferences => {
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
			getParsedData(source).then(data => data as Planet).then(data => {
				if (data.shipyard.length > 0) {
					setShipyards(<section>
						<h2>Shipyards</h2>
						<ReferenceLinkList sources={data.shipyard.map(shipyard => new ReferenceSource('shipyard', shipyard))} title='This planet has the following shipyards available:'/>
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
			getAllReferences(source, 'ship').then(references => {
				if (references.length > 0) {
					setVariants(<section>
						<h2>Variants</h2>
						<ReferenceLinkList sources={references} title='This ship has the following variants:'/>
					</section>);
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
				getParsedData(source).then(data => data as System).then(data => {
					setFleets(<section>
						<h2>Fleets</h2>
						{data.fleets.length > 0 ?
							<ReferenceLinkList sources={data.fleets.map(fleet => new ReferenceSource('fleet', fleet.name))} title='The following fleets appear in this system naturally:'/>
							: <>No fleets appear in this system naturally.</>}
					</section>);
				})
				break;
			case 'ship':
				getAllReferences(source, 'fleet').then(myFleets => {
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

export function DiscussionGenerator(source: ReferenceSource, title?: string) {
	if (isMultiPart(source)) {
		return undefined;
	}
	return <section>
		<h2>Discussion</h2>
		<div className="discussion-container">
			<Giscus
				repo="tibetiroka/endless-sky-wiki-generator"
				repoId="R_kgDOQW1tFg"
				category="giscus"
				categoryId="DIC_kwDOQW1tFs4C2CYG"
				mapping="og:title"
				term="Welcome to @giscus/react component!"
				reactionsEnabled="0"
				emitMetadata="0"
				inputPosition="bottom"
				theme="dark"
				lang="en"
				loading="lazy"
			/>
		</div>
	</section>
}

export default WikiPage;