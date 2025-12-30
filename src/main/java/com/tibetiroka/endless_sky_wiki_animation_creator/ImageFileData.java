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

import java.io.File;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

class ImageFileData {
	private static final String BLENDING_MODES = "-=^+~";
	private static final Pattern ANIMATION_PATTERN = Pattern.compile("[" + BLENDING_MODES + "]\\d+$");
	public final File file;
	public final int frameNumber;
	public final boolean isImage;
	public final String name;

	public ImageFileData(File imageFile, File root) {
		if(!imageFile.isFile() || !imageFile.getName().contains(".")) {
			throw new IllegalArgumentException("Invalid image file");
		}
		file = imageFile;

		boolean isImage = true;

		String relative = root.toPath().relativize(imageFile.toPath()).toString();
		relative = relative.substring(0, relative.lastIndexOf('.'));

		Matcher matcher = ANIMATION_PATTERN.matcher(relative);
		if(!matcher.find()) {
			frameNumber = 0;
			this.isImage = true;
			name = relative;
			return;
		}

		if(relative.endsWith("@2x")) {
			relative = relative.substring(0, relative.length() - "@2x".length());
		}
		if(relative.endsWith("@1x")) {
			relative = relative.substring(0, relative.length() - "@1x".length());
		}
		if(relative.endsWith("@sw")) {
			relative = relative.substring(0, relative.length() - "@sw".length());
			isImage = false;
		}
		String frame = "";
		while(!relative.isEmpty() && relative.charAt(relative.length() - 1) >= '0' && relative.charAt(relative.length() - 1) <= '9') {
			frame = relative.charAt(relative.length() - 1) + frame;
			relative = relative.substring(0, relative.length() - 1);
		}
		if(!relative.isEmpty() && BLENDING_MODES.contains(relative.charAt(relative.length() - 1) + "")) {
			relative = relative.substring(0, relative.length() - 1);
			frameNumber = Integer.parseInt(frame);
		} else {
			relative = relative + frame;
			frameNumber = 0;
		}
		this.name = relative;
		this.isImage = isImage;
	}
}
