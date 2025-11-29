import {getCurrentSource, HOME_PATH} from "./web_utils.ts";
import {ReferenceSource} from "./data/ReferenceSource.ts";
import {StatBox} from "./components/StatBox.tsx";
import {GoHome} from "./components/GoHome.tsx";

function Comparison() {
	const type: string = getCurrentSource(HOME_PATH + '/compare').type;
	const goHome = GoHome();
	if (type === 'main') {
		return goHome;
	}
	const urlParams = new URLSearchParams(window.location.search);
	console.log(urlParams);
	const sourcesString = urlParams.get('sources');
	if (sourcesString === null) {
		return goHome;
	}
	try {
		const sourcesObject = JSON.parse(sourcesString);
		if (sourcesObject && Array.isArray(sourcesObject)) {
			const sources: ReferenceSource[] = sourcesObject.map(s => new ReferenceSource(type, s));
			return <div className='global-stat-box'>
				<StatBox elements={sources}/>
			</div>
		}
	} catch (e) {
		return goHome;
	}
	return goHome;
}

export default Comparison;