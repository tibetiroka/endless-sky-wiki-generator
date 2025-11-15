/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

package com.tibetiroka.endless_sky_wiki_animation_creator;

import org.jetbrains.annotations.NotNull;

import java.util.Map;

public class Animation {
	public final @NotNull String name;
	public final boolean rewind;
	public final int startFrame;
	public final double timePerFrame;

	public Animation(@NotNull Object data) {
		if(data instanceof String s) {
			name = s;
			timePerFrame = 1. / 60.;
			startFrame = 0;
			rewind = false;
		} else if(data instanceof Map animationData) {
			name = (String) animationData.get("name");
			if(animationData.containsKey("frame rate")) {
				timePerFrame = 1. / Double.parseDouble((String) animationData.get("frame rate"));
			} else if(animationData.containsKey("frame time")) {
				timePerFrame = Double.parseDouble((String) animationData.get("frame time")) / 60.;
			} else {
				timePerFrame = 1. / 60.;
			}
			if(animationData.containsKey("start frame")) {
				startFrame = Integer.parseInt((String) animationData.get("start frame"));
			} else {
				startFrame = 0;
			}
			rewind = animationData.containsKey("rewind");
		} else {
			throw new IllegalArgumentException("Invalid animation data");
		}
	}
}
