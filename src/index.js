import 'bootstrap/dist/css/bootstrap.min.css';
//
import React from 'react';
import ReactDOM from 'react-dom/client';

import SharedLayout, {updateDarkMode} from "./SharedLayout";
import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import Home from "./Home";
import Changelog from "./Changelog";
import {CUSTOM_PAGES} from "./SearchBox";

const domRoot = ReactDOM.createRoot(document.getElementById('root'));
registerCustomPages();
domRoot.render(
	<React.StrictMode>
		<BrowserRouter>
			<Routes>
				<Route exact path="/" Component={SharedLayout}>
					<Route index Component={Home}/>
					<Route exact path="/changelog" Component={Changelog}/>
					<Route path="*" Component={DynamicRoute}/>
				</Route>
			</Routes>
		</BrowserRouter>
	</React.StrictMode>
);

function DynamicRoute() {
	//todo
	return <></>
}

function MissingRoute() {
	return <Navigate to={{pathname: '/'}}/>
}

function registerCustomPages() {
	// add pages to CUSTOM_PAGES here
}