import {CommitData} from "./CommitData";
import {ReferenceSource} from "./ReferenceSource.ts";

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