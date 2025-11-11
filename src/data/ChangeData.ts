import {CommitData} from "./CommitData.ts";

export class DiffData {
	added: boolean = false;
	removed: boolean = false;
	diff: string = "";
}

export class ChangeData {
	diff: DiffData = new DiffData();
	commit: CommitData = new CommitData();
}

export class BulkChangeData {
	diff: DiffData[] = [];
	commit: CommitData = new CommitData();
}