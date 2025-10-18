/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {getPath} from './utils.ts';

export const PATH = getPath();

let pathParts = PATH.split('/');
if (pathParts.length === 0) {
    pathParts = Array('main');
}

let contentType = pathParts[0];
let contentName = pathParts.length > 1 ? pathParts[1] : null;
let extraData = window.location.search;

//todo
switch (contentName) {
}

export const CONTENT_TYPE = contentType;
export const CONTENT_NAME = contentName;
export const EXTRA_DATA = extraData;