/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

export class GameFileList {
	constructor(files: string[]) {
		this.images = {};
		this.sounds = {};

		files.forEach(file => {
			if (file.startsWith('images/')) {
				const modes = ['-', '+', '^', '~'];
				const types = ['@2x', '@1x', '@sw'];

				let baseName = file.substring('images/'.length);
				// remove extension
				baseName = baseName.split('.')[0];
				for (const type of types) {
					if(baseName.endsWith(type)) {
						baseName = baseName.substring(0, baseName.length - type.length);
					}
				}
				const animationWhitelist = ['asteroid', 'effect', 'projectile', 'ship'];
				let index: string | number = '';
				if(animationWhitelist.includes(baseName.split('/')[0])) {
					// this is part of an animation
					while(baseName.length > 0) {
						const last = baseName[baseName.length - 1];
						const number = Number.parseInt(last);
						if(isNaN(number)) {
							break;
						}
						index = last + index;
						baseName = baseName.substring(0, baseName.length - 1);
					}
				}
				if(index === '') {
					index = 0;
				}
				else {
					index = Number.parseInt(index);
				}

				for (const mode of modes) {
					if(baseName.endsWith(mode)) {
						baseName = baseName.substring(0, baseName.length - mode.length);
						break;
					}
				}
				if(!this.images[baseName]) {
					this.images[baseName] = [];
				}
				while(this.images[baseName].length <= index) {
					this.images[baseName].push('images/outfit/unknown.png');
				}
				this.images[baseName][index] = file;
			}
			else {
				const types = ['@3x'];
				const modes = ['~'];
				// remove extension
				let baseName = file.split('.')[0];
				for (const type of types) {
					if(baseName.endsWith(type)) {
						continue;
					}
				}
				for (const mode of modes) {
					if(baseName.endsWith(mode)) {
						baseName = baseName.substring(0, baseName.length - mode.length);
						continue;
					}
				}
				this.sounds[baseName] = file;
			}
		});
	}

	images: {[index: string]: string[]};
	sounds: {[index: string]: string};
}