import {CommitData} from "./CommitData";

export class ObjectData {
    // core data
    type: string;
    name: string;
    data: any;
    // commonly used properties
    displayName: string;

    constructor(type: string, name: string, data: any) {
        this.type = type;
        this.name = name;
        this.data = data;
        //
        this.displayName = data.data['display name'] ?? data.data['name'] ?? this.name;
    }

    getLocation(): { filename: string, line: number } {
        return {"filename": this.data.filename, "line": this.data.line};
    }

    isRemoved(): boolean {
        return this.data.removed == null; // also checks undefined
    }

    getRemovedCommit(): CommitData | null {
        return this.data.removed as CommitData;
    }

    getLastCommit(): String | null {
        return this.data.lastCommit;
    }
}