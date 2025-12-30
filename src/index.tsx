import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css'
//
import React from 'react';
import ReactDOM from 'react-dom/client';

import SharedLayout, {updateDarkMode} from "./SharedLayout";
import {BrowserRouter, Route, Routes} from "react-router";
import Home from "./pages/Home";
import Comparison from "./Comparison.tsx";
import {ReferenceSource} from "./data/ReferenceSource.ts";
import WikiPage from "./pages/WikiPage.tsx";
import {getCurrentSource, HOME_PATH, isOfficial} from "./web_utils.ts";
import {GoHome} from "./components/GoHome.tsx";
import {CUSTOM_PAGES} from "./components/SearchBox.tsx";
import {findSource} from "./utils.ts";
import {Guides} from "./pages/Guides.tsx";

// @ts-ignore
const domRoot = ReactDOM.createRoot(document.getElementById('root'));
registerCustomPages();
domRoot.render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				{/*@ts-ignore*/}
				<Route exact path={HOME_PATH} Component={SharedLayout}>
					{/*@ts-ignore*/}
					<Route index Component={Home}/>
					{/*@ts-ignore*/}
					<Route path="compare">
						<Route index Component={GoHome}/>
						<Route path="*" Component={Comparison}/>
					</Route>
					<Route path='guides' Component={Guides}/>
					<Route path="*" Component={DynamicRoute}/>
				</Route>
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
);

function awaitElement(selector: any) {
	return new Promise(resolve => {
		if (document.querySelector(selector)) {
			return resolve(document.querySelector(selector));
		}
		const observer = new MutationObserver(_ => {
			if (document.querySelector(selector)) {
				observer.disconnect();
				resolve(document.querySelector(selector));
			}
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	});
}

awaitElement('#darkModeToggle').then(() => updateDarkMode());

document.addEventListener('click', e => {
	// @ts-ignore
	if (e.target.matches("a *") || e.target.matches("a")) {
		// @ts-ignore
		const target = e.target.closest("a");
		const link = target.href;
		if (link) {
			if (!isOfficial(link)) {
				target.target = "_blank";
				target.rel = 'noreferrer nofollow noopener';
			}
		}
	}
});

function DynamicRoute() {
	const source: ReferenceSource = getCurrentSource();
	let title = '';
	for (const entry of CUSTOM_PAGES.getIndex()) {
		if (findSource(source, entry.value) !== null) {
			title = entry.key;
			break;
		}
	}

	return <WikiPage source={source} title={title}/>
}

function registerCustomPages() {
	/*function addPage(name: string, source: ReferenceSource, generator: PageGenerator) {
		CUSTOM_PAGES.addEntry(name, source);
		CUSTOM_PAGE_GENERATORS.set(source, generator)
	}*/
}