import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css'
//
import React from 'react';
import ReactDOM from 'react-dom/client';

import SharedLayout, {updateDarkMode} from "./SharedLayout";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import Home from "./Home";
import Changelog from "./Changelog";
import {ReferenceSource} from "./data/ReferenceSource.ts";
import WikiPage from "./WikiPage.tsx";
import {getCurrentSource, isOfficial} from "./web_utils.ts";

// @ts-ignore
const domRoot = ReactDOM.createRoot(document.getElementById('root'));
registerCustomPages();
domRoot.render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				{/*@ts-ignore*/}
				<Route exact path="/" Component={SharedLayout}>
					{/*@ts-ignore*/}
					<Route index Component={Home}/>
					{/*@ts-ignore*/}
					<Route exact path="/changelog" Component={Changelog}/>
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
			}
		}
	}
});

function DynamicRoute() {
	const source: ReferenceSource = getCurrentSource();
	// todo: look up title from dynamic sources

	return <WikiPage source={source} title=""/>
}

function registerCustomPages() {
	// add pages to CUSTOM_PAGES here
}