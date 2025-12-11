import {getCurrentSource, HOME_PATH} from "./web_utils.ts";
import {ReferenceSource} from "./data/ReferenceSource.ts";
import {StatBox} from "./components/StatBox.tsx";
import {GoHome} from "./components/GoHome.tsx";
import {ComparisonBulkNavigation} from "./components/ComparisonNavigation.tsx";
import {useState} from "react";

function Comparison() {
	const [titleSet, setTitleSet] = useState(false);
	if (!titleSet) {
		setTitleSet(true);
		document.title = 'Comparison | ' + document.title;
	}

	const type: string = getCurrentSource(HOME_PATH + '/compare').type;
	const goHome = GoHome();
	if (type === 'main') {
		return goHome;
	}
	const urlParams = new URLSearchParams(window.location.search);
	let sourcesString: string | null = urlParams.get('sources');
	if (sourcesString === null) {
		sourcesString = localStorage.getItem('compare/' + type);
		if (sourcesString === null) {
			sourcesString = JSON.stringify([]);
		}
	}
	try {
		const sourcesObject = JSON.parse(sourcesString);
		if (sourcesObject && Array.isArray(sourcesObject) && sourcesObject.length > 0) {
			const sources: ReferenceSource[] = sourcesObject.map(s => new ReferenceSource(type, s));
			return <div className='global-stat-box'>
				<ComparisonBulkNavigation type={type} isLocal={urlParams.get('sources') === null} sources={sourcesObject}/>
				<StatBox elements={sources}/>
			</div>
		} else {
			return <div className='global-stat-box'>No items found in the current comparison.</div>
		}
	} catch (e) {
		return goHome;
	}
}

export default Comparison;