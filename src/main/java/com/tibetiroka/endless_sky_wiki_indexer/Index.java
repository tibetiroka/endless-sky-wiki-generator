/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

package com.tibetiroka.endless_sky_wiki_indexer;

import com.google.gson.*;
import org.jetbrains.annotations.NotNull;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class Index<T> {
	/**
	 * The list of all indexed names, with their display names and plural variants.
	 */
	private final Map<@NotNull String, @NotNull Set<@NotNull T>> entries = new HashMap<>();
	/**
	 * The sets of entries referencing an indexed entry. Only counts "engine" references, not textual references.
	 */
	private final Map<@NotNull String, @NotNull Set<@NotNull ReferenceSource>> references = new HashMap<>();
	/**
	 * The top-level node being indexed (e.g. "ship", "outfit")
	 */
	private final @NotNull String topLevelNode;

	public Index(@NotNull String topLevelNode) {
		this.topLevelNode = topLevelNode;
	}

	public Map<@NotNull String, @NotNull Set<@NotNull T>> getEntries() {
		return entries;
	}

	public @NotNull String getTopLevelNode() {
		return topLevelNode;
	}

	public void addEntry(@NotNull String entry) {
		entries.putIfAbsent(entry, new HashSet<>());
	}

	public void addEntry(@NotNull String entry, @NotNull T displayName) {
		addEntry(entry);
		entries.get(entry).add(displayName);
	}

	public void addReference(@NotNull String entry, @NotNull ReferenceSource source) {
		addEntry(entry);
		references.putIfAbsent(entry, new HashSet<>());
		references.get(entry).add(source);
	}

	public void saveEntries(@NotNull File directory) throws IOException {
		save(directory, entries);
	}

	public void saveReferences(@NotNull File directory) throws IOException {
		save(directory, references);
	}

	private <T> void save(@NotNull File directory, Map<@NotNull String, @NotNull Set<@NotNull T>> data) throws IOException {
		Gson gson = new GsonBuilder().setFormattingStyle(FormattingStyle.PRETTY).create();
		JsonObject json = new JsonObject();
		data.forEach((key, values) -> {
			JsonArray element = new JsonArray(values.size());
			if(!values.isEmpty()) {
				values.forEach(value -> element.add(gson.toJsonTree(value)));
			}
			json.add(key, element);
		});
		try(BufferedWriter writer = new BufferedWriter(new FileWriter(new File(directory, topLevelNode)))) {
			gson.toJson(json, writer);
		}
	}
}
