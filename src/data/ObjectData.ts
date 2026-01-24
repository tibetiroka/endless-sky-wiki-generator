import {CommitData} from "./CommitData";
import {ReferenceSource} from "./ReferenceSource.ts";
import {
	Effect,
	Fleet,
	Galaxy,
	GameColor,
	GameObject,
	Government,
	Hazard,
	LandingMessage,
	Minable,
	Outfit,
	Planet,
	Ship,
	Shop,
	Star,
	Swizzle,
	System,
	Wormhole
} from "./DataScheme.tsx";

export type DataType = {
	filename: string,
	line: number,
	data: any,
	removed?: CommitData,
	lastCommit?: string
};

export class ObjectData {
	// core data
	id: ReferenceSource;
	data: DataType;
	// commonly used properties
	displayName: string;

	constructor(id: ReferenceSource, data: DataType) {
		this.id = id;
		this.data = data;
		//
		this.displayName = data.data['display name'] ?? data.data['name'] ?? this.id.name;
	}

	parse(): GameObject {
		switch (this.id.type) {
			case 'effect':
				return new Effect(this.getData());
			case 'fleet':
				return new Fleet(this.getData());
			case 'galaxy':
				return new Galaxy(this.getData());
			case 'government':
				return new Government(this.getData());
			case 'hazard':
				return new Hazard(this.getData());
			case 'landing message':
				return new LandingMessage(this.getData());
			case 'minable':
				return new Minable(this.getData());
			case 'outfit':
				return new Outfit(this.getData());
			case 'outfitter':
				return new Shop(this.getData(), 'outfitter');
			case 'planet':
				return new Planet(this.getData());
			case 'ship':
				return new Ship(this.getData());
			case 'shipyard':
				return new Shop(this.getData(), 'shipyard');
			case 'star':
				return new Star(this.getData());
			case 'swizzle':
				return new Swizzle(this.getData());
			case 'system':
				return new System(this.getData());
			case 'wormhole':
				return new Wormhole(this.getData());
			case 'color':
				return new GameColor(this.getData(), true);
			default:
				return new GameObject(this.getData(), this.id.type);
		}
	}

	getSource(): ReferenceSource {
		return this.id;
	}

	getData(): any {
		return this.data.data;
	}

	getLocation(): { filename: string, line: number } {
		return {"filename": this.data.filename, "line": this.data.line};
	}

	isRemoved(): boolean {
		return !!this.data.removed;
	}

	getRemovedCommit(): CommitData | undefined {
		return this.data.removed;
	}

	getLastCommit(): string | undefined {
		return this.data.lastCommit;
	}
}