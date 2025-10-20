/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {ReferenceSource} from "./data/ReferenceSource.ts";

export const HOST_ORIGIN: string = 'endless-sky-wiki.github.io';
export const DATA_ORIGIN: string = isHostedOnLocalhost() ? 'http://localhost:8080/'
	: 'https://raw.githubusercontent.com/tibetiroka/endless-sky-wiki-generator/refs/heads/deployment/';

export function isHostedOnLocalhost(hostname: string = window.location.hostname): boolean {
	return hostname === 'localhost';
}

export function isHostedOn(domain: string, hostname: string = window.location.hostname, allowSubdomain: boolean = false): boolean {
	if (hostname === domain) {
		return true;
	} else {
		return allowSubdomain && hostname.endsWith('.' + domain);
	}
}

export function getDomainWithProtocol(protocol: string = window.location.protocol, baseDomain: string = window.location.hostname): string {
	return (protocol.endsWith(':') ? protocol : protocol + ':') + '//' + baseDomain + (window.location.port.length > 0 ? ':' + window.location.port : '')
}

export function getPath(relativeTo: string = '', pathname: string = decodeURI(window.location.pathname)): string {
	if (pathname.startsWith('/')) {
		return pathname.substring(relativeTo.length + (relativeTo.startsWith('/') ? 0 : 1));
	}
	// empty path
	return '';
}

export function getCurrentSource(relativeTo: string = '', pathname: string = decodeURI(window.location.pathname)): ReferenceSource {
	let path: string = getPath(relativeTo, pathname);
	path = path.replace(/^\/+/, '').replace(/\/+$/, '');
	const parts: string[] = path.split('/');
	if (parts.length === 0) {
		return new ReferenceSource('main', null);
	} else if (parts.length === 1) {
		return new ReferenceSource(parts[0], null);
	} else {
		return new ReferenceSource(parts[0], parts[1]);
	}
}

export function isOfficial(href: string = window.location.href): boolean {
	if (href === 'localhost' || href.startsWith('/')) {
		return true;
	}
	href = new URL(href).hostname;
	return isHostedOnLocalhost(href) || isHostedOn(HOST_ORIGIN, href);
}

export function fetchData(path: string, cacheLifeMs: number = 1000 * 60 * 60 * 5): Promise<string> {
	const url: URL = new URL(DATA_ORIGIN.toString() + path);
	const cacheDate = localStorage.getItem(path + "|date");
	// check if there is a cached value
	if (cacheLifeMs > 0 && cacheDate !== null) {
		const date = Number.parseInt(cacheDate);
		const age = Date.now() - date;
		if (age < cacheLifeMs) {
			const cacheData = localStorage.getItem(path);
			if (cacheData !== null && cacheData !== '') {
				return Promise.resolve(cacheData);
			} else {
				console.log('invalid');
				return Promise.reject('Cached data is marked as invalid');
			}
		}
	}
	return fetch(url).then(response => {
		const decompressed = response.body?.pipeThrough(new DecompressionStream('gzip'));
		return new Response(decompressed).text();
	}).then(text => {
		if (cacheLifeMs > 0) {
			localStorage.setItem(path + "|date", Date.now().toString());
			localStorage.setItem(path + "|life", cacheLifeMs.toString());
			localStorage.setItem(path, text);
		}
		return Promise.resolve(text);
	}).catch(reason => {
		localStorage.setItem(path + "|date", Date.now().toString());
		localStorage.setItem(path + "|life", (1000 * 60 * 5).toString());
		localStorage.setItem(path, '');
		return reason;
	});
}

function clearCache() {
	for (const key in localStorage) {
		if (key.endsWith('|date')) {
			const rawKey = key.substring(0, key.length - '|date'.length);
			const date = Number.parseInt(localStorage.getItem(key) ?? '0');
			const life = Number.parseInt(localStorage.getItem(rawKey + '|life') ?? '0');
			if (Date.now() - date >= life) {
				localStorage.removeItem(rawKey);
				localStorage.removeItem(key);
				localStorage.removeItem(rawKey + '|life');
			}
		}
	}
}

clearCache();