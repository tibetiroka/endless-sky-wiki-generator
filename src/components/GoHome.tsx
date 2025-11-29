import {Navigate} from "react-router";
import {HOME_PATH} from "../web_utils.ts";

export function GoHome() {
	return <Navigate to={{pathname: '/' + HOME_PATH}}/>
}