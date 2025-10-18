/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

export const HOST_ORIGIN: string = 'endless-sky-wiki.github.io';
export const DATA_ORIGIN: URL = new URL('https://raw.githubusercontent.com/tibetiroka/endless-sky-wiki-generator/refs/heads/deployment/');

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

export function getPath(relativeTo: string = '', pathname: string = window.location.pathname): string {
    if (pathname.startsWith('/')) {
        return pathname.substring(relativeTo.length + (relativeTo.startsWith('/') ? 0 : 1));
    }
    // empty path
    return '';
}

export function isOfficial(href: string = window.location.href): boolean {
    if (href === 'localhost' || href.startsWith('/')) {
        return true;
    }
    href = new URL(href).hostname;
    return isHostedOnLocalhost(href) || isHostedOn(HOST_ORIGIN, href);
}

export function fetchData(path: string, cacheLifeMs: number = 0): Promise<string> {
    const url: URL = new URL(path, DATA_ORIGIN);
    if (cacheLifeMs > 0) {
        const cacheDate = localStorage.getItem(path + "|date");
        if(cacheDate !== null) {
            const date = Date.parse(cacheDate);
            const age = Date.now() - date;
            if(age < cacheLifeMs) {
                const cacheData = localStorage.getItem(path);
                if(cacheData !== null) {
                    return Promise.resolve(cacheData);
                }
            }
        }
    }
    return fetch(url).then(response => {
        const decompressed = response.body?.pipeThrough(new DecompressionStream('gzip'));
        return new Response(decompressed).text();
    }).then(text=> {
        if(cacheLifeMs > 0) {
            localStorage.setItem(path + "|date", Date.now().toString());
            localStorage.setItem(path, text);
        }
        return Promise.resolve(text);
    });
}