/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReactElement} from "react";
import {getParsedData, getReferences} from "./DataFetcher.ts";
import {getAllReferences, ReferenceSource} from "./ReferenceSource.ts";

export function asArray(data: any): any[] {
	if (!data) {
		return [];
	} else if (Array.isArray(data)) {
		return data;
	} else {
		return [data];
	}
}

function getName(data: any): string | undefined {
	if (data === undefined) {
		return undefined;
	} else if (typeof data === 'string') {
		return data;
	} else {
		return data.name;
	}
}

function getInt(data: any, def: number = 0): number {
	if (data === undefined) {
		return def;
	} else if (typeof data === 'number') {
		return data;
	} else if (typeof data === 'string') {
		return Number.parseInt(data);
	} else {
		return def;
	}
}

function getFloat(data: any, def: number = 0): number {
	if (data === undefined) {
		return def;
	} else if (typeof data === 'number') {
		return data;
	} else if (typeof data === 'string') {
		return Number.parseFloat(data);
	} else {
		return def;
	}
}

function getTopLevelTokens(data: any): string[] {
	if (data === undefined) {
		return [];
	}
	const top: string[] = [getName(data) as string];
	if (data.values) {
		top.push(...(data.values as string[]));
	}
	return top;
}

// Game data types with the more important fields parsed

export class GameObject {
	name: string;
	displayName: string;
	type: string | undefined;

	constructor(data: any, type: string | undefined) {
		this.name = data.name;
		const key: keyof typeof data = 'display name';
		this.displayName = data[key] ?? this.name;
		this.type = type;
	}

	getReferenceObjects(type: string): Promise<GameObject[]> {
		return getReferences(this.type as string)
			.then(references => (references[this.name] ?? []).filter(reference => reference.type === type))
			.then(references => Promise.all(references.map(reference => getParsedData(reference))));
	}
}

// Gets and parses all reference object data of a type to a source.
export function getAllReferenceObjects(to: ReferenceSource, type: string): Promise<GameObject[]> {
	return getAllReferences(to, type).then(sources => Promise.all(sources.map(source => getParsedData(source))));
}

export class Point {
	x: number;
	y: number;

	constructor(data: any) {
		if (data === undefined) {
			this.x = 0;
			this.y = 0;
		} else if (Array.isArray(data)) {
			this.x = getFloat(data[0]);
			this.y = getFloat(data[1]);
		} else {
			this.x = getFloat(data.name);
			this.y = getFloat(data.values[0]);
		}
	}
}

export class Effect extends GameObject {
	sound: string | undefined;

	constructor(data: any) {
		super(data, 'effect');
		this.sound = data.sound;
	}
}

export type NameAndCount = { name: string; count: number };

export class Fleet extends GameObject {
	government: string | undefined;
	variants: NameAndCount[][];

	constructor(data: any) {
		super(data, 'fleet');
		this.government = data.government;
		this.variants = [];
		asArray(data.variant).forEach(variant => {
			const v: NameAndCount[] = [];
			for (const [key, value] of Object.entries(variant)) {
				if (key !== 'name' && key !== 'values') {
					v.push({name: key, count: getInt(value, 0)})
				}
			}
			this.variants.push(v);
		});
	}
}

export class Galaxy extends GameObject {
	pos: Point;

	constructor(data: any) {
		super(data, 'galaxy');
		this.pos = new Point(data.pos);
	}
}

export class Government extends GameObject {
	bribe: number;
	swizzle: string | undefined;

	constructor(data: any) {
		super(data, 'government');
		this.bribe = getInt(data.bribe);
		this.swizzle = data.swizzle;
	}
}

export class Hazard extends GameObject {
	constructor(data: any) {
		super(data, 'hazard');
	}
}

export class LandingMessage extends GameObject {
	landables: string[];

	constructor(data: any) {
		super(data, 'landing message');
		this.landables = [];
		for (let key of Object.keys(data ?? {})) {
			if (key !== 'name') {
				this.landables.push(key);
			}
		}
	}
}

export class Minable extends GameObject {
	hull: number;
	randomHull: number;
	payload: NameAndCount[];

	constructor(data: any) {
		super(data, 'minable');
		this.hull = getInt(data.hull);
		const key: keyof typeof data = 'random hull';
		this.randomHull = getInt(data[key]);
		this.payload = asArray(data.payload).map(payload => {
			return {name: payload.name, count: payload.values ? payload.values[0] : 1}
		});
	}
}

type ConditionalTextLine = { text: string, conditional: boolean };

export class ConditionalText {
	lines: ConditionalTextLine[];

	constructor(data: any) {
		this.lines = [];
		for (const line of asArray(data)) {
			this.lines.push({text: getName(line) as string, conditional: typeof line !== 'string'});
		}
	}

	toElement(): ReactElement {
		return <>
			{this.lines.map(line => {
				if (line.conditional) {
					return <p key={line.text} style={{fontStyle: "italic"}} title='This text is not always displayed in-game.'>{line.text}</p>;
				} else {
					return <p key={line.text}>{line.text}</p>;
				}
			})}
		</>
	}
}

export class Outfit extends GameObject {
	category: string | undefined;
	licenses: string[];
	description: ConditionalText;
	series: string | undefined;
	index: number;

	constructor(data: any) {
		super(data, 'outfit');
		this.category = data.category;
		this.licenses = asArray(data.licenses).map(l => Object.keys(l)[0]);
		this.description = new ConditionalText(data.description);
		this.series = data.series;
		this.index = data.index;
	}
}

export class Shop extends GameObject {
	hasToSell: boolean;
	hasLocationFilter: boolean;
	stock: string[];

	constructor(data: any, type: string) {
		super(data, type);

		const key: keyof typeof data = 'to sell';
		this.hasToSell = data[key] !== undefined;
		this.hasLocationFilter = data.location !== undefined;

		const blacklist = ['name', 'location', 'stock', 'to sell', 'remove'];
		const sales: string[] = Object.keys(data ?? {});
		this.stock = sales.filter(sale => !blacklist.includes(sale));
		this.stock = this.stock.concat(Object.keys(data.stock ?? {}));
	}
}

export class Planet extends GameObject {
	attributes: string[];
	music: string | undefined;
	description: ConditionalText;
	spaceport: ConditionalText;
	government: string | undefined;
	shipyard: string[];
	outfitter: string[];
	bribe: number;
	wormhole: string | undefined;

	constructor(data: any) {
		super(data, 'planet');
		this.attributes = getTopLevelTokens(data.attributes);
		this.music = data.music;
		this.description = new ConditionalText(data.description);
		this.spaceport = new ConditionalText(data.spaceport);
		this.government = data.government;
		this.shipyard = asArray(data.shipyard);
		this.outfitter = asArray(data.outfitter);
		this.bribe = getInt(data.bribe);
		this.wormhole = data.wormhole;
	}
}

export class Ship extends GameObject {
	base: string | undefined;
	attributes: any;
	description: ConditionalText;
	outfits: NameAndCount[];
	guns: Point[];
	turrets: Point[];
	bays: { type: string, pos: Point }[];

	constructor(data: any) {
		super(data, 'ship');
		this.base = data.base;
		this.attributes = data.attributes;
		this.description = new ConditionalText(data.description);
		this.outfits = asArray(Object.entries(data.outfits ?? {})).map(([key, value]) => {
			return {name: key, count: getInt(value, 1)};
		});
		this.guns = asArray(data.gun).map(pos => new Point(pos));
		this.turrets = asArray(data.turret).map(pos => new Point(pos));
		this.bays = asArray(data.bay).map(bay => {
			return {type: bay.name, pos: new Point(bay.values)};
		});
	}
}

export class Star extends GameObject {
	power: number;
	wind: number;

	constructor(data: any) {
		super(data, 'star');
		this.power = getFloat(data.power);
		this.wind = getFloat(data.wind);
	}
}

export class Swizzle extends GameObject {
	red: number[];
	green: number[];
	blue: number[];
	alpha: number[];

	constructor(data: any) {
		super(data, 'swizzle');
		this.red = getTopLevelTokens(data.red).map(getFloat);
		this.green = getTopLevelTokens(data.green).map(getFloat);
		this.blue = getTopLevelTokens(data.blue).map(getFloat);
		this.alpha = getTopLevelTokens(data.alpha).map(getFloat);
	}
}

export class System extends GameObject {
	inaccessible: boolean;
	hidden: boolean;
	shrouded: boolean;
	pos: Point;
	government: string | undefined;
	attributes: string[];
	music: string | undefined;
	links: string[];
	asteroids: NameAndCount[];
	minables: NameAndCount[];
	trades: { name: string, cost: number }[];
	// name and period
	fleets: { name: string, period: number }[];
	raidFleets: string[];
	hazards: { name: string, period: number }[];
	objects: SystemObject[];

	constructor(data: any) {
		super(data, 'system');
		this.inaccessible = data.inaccessible !== undefined;
		this.hidden = data.hidden !== undefined;
		this.shrouded = data.shrouded !== undefined;
		this.pos = new Point(data.pos);
		this.government = data.government;
		this.attributes = asArray(getTopLevelTokens(data.attributes));
		this.music = data.music;
		this.links = asArray(data.link);
		this.asteroids = asArray(data.asteroids).map(asteroid => {
			return {name: asteroid.name, count: getInt(asteroid.values[1])};
		});
		this.minables = asArray(data.minables).map(minable => {
			return {name: minable.name, count: getInt(minable.values[1])};
		});
		this.trades = asArray(data.trade).map(trade => {
			return {name: trade.name, cost: getFloat(trade.values[1])};
		});
		this.fleets = asArray(data.fleet).map(fleet => {
			return {name: fleet.name, period: getInt(fleet.values[1])};
		});
		this.raidFleets = asArray(data.raid).map(fleet => getName(fleet) as string);
		this.hazards = asArray(data.hazard).map(hazard => {
			return {name: hazard.name, period: getInt(hazard.values[1])}
		})
		this.objects = asArray(data.object).map(object => new SystemObject(object));
	}

}

export class SystemObject {
	object: SystemPlanet | GenericSystemObject;
	isPlanet: boolean;

	constructor(data: any) {
		if (getName(data)) {
			this.isPlanet = true;
			this.object = new SystemPlanet(data);
		} else {
			this.isPlanet = false;
			this.object = new GenericSystemObject(data);
		}
	}

}

export class GenericSystemObject {
	sprite: string | undefined;
	distance: number;
	// degrees offset within orbit
	offset: number;
	hazard: { name: string, period: number }[];
	objects: SystemObject[];

	constructor(data: any) {
		this.sprite = data.sprite;
		this.distance = getFloat(data.distance);
		this.offset = getFloat(data.offset);
		this.hazard = asArray(data.hazard).map(hazard => {
			return {name: hazard.name, period: getInt(hazard.values[0])};
		});
		this.objects = asArray(data.object).map(object => new SystemObject(object));
	}

}

export class SystemPlanet extends GenericSystemObject {
	gameObject: GameObject;

	constructor(data: any) {
		super(data);
		this.gameObject = new GameObject(data, 'planet');
	}
}

export class Wormhole extends GameObject {
	links: { from: string, to: string }[];
	mappable: boolean;

	constructor(data: any) {
		super(data, 'wormhole');
		this.links = asArray(data.link).map(link => getTopLevelTokens(link)).map(arr => {
			return {from: arr[0], to: arr[1]};
		});
		this.mappable = data.mappable !== undefined;
	}
}

