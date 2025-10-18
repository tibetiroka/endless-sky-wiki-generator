import {CommitData} from "./CommitData";

export class DiffData {
    added: boolean = false;
    removed: boolean = false;
    diff: string = "";
}

export class ChangeData {
    diff: DiffData = new DiffData();
    commit: CommitData = new CommitData();
}