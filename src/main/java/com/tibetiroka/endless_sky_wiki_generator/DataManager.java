/*
 * Copyright (c) 2025 by tibetiroka.
 *
 * endless-sky-wiki-generator is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * endless-sky-wiki-generator is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

package com.tibetiroka.endless_sky_wiki_generator;

import com.github.difflib.DiffUtils;
import com.github.difflib.UnifiedDiffUtils;
import com.github.difflib.patch.AbstractDelta;
import com.github.difflib.patch.Patch;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import com.tibetiroka.endless_sky_wiki_generator.Tokenizer.IndentLevel;

import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public final class DataManager {
	private final Map<String, DataNode> nodes = new HashMap<>();

	/**
	 * Stores the named nodes from the list, and can later compute diffs and other stuff from them.
	 *
	 * @param nodes     All nodes that may be stores
	 * @param keyFilter The name of the node type managed here
	 */
	public DataManager(@NotNull List<@NotNull DataNode> nodes, @NotNull String keyFilter) {
		nodes.stream()
		     .filter(n -> Objects.equals(keyFilter, n.getKey()))
		     .filter(n -> n.getName() != null)
		     .filter(n -> !n.getChildren().isEmpty())
		     .forEach(n -> this.nodes.put(n.getName(), n));
	}

	public @NotNull JsonObject generateDiff(@NotNull DataManager newData) {
		Set<String> allKeys = new HashSet<>(nodes.keySet());
		allKeys.addAll(newData.nodes.keySet());

		JsonObject json = new JsonObject();
		allKeys.stream()
		       .parallel()
		       .forEach(key -> {
			       JsonObject child = generateDiff(nodes.get(key), newData.nodes.get(key));
			       if(child != null) {
				       synchronized(this) {
					       json.add(key, child);
				       }
			       }
		       });
		return json;
	}

	public @NotNull JsonObject toJson() {
		JsonObject json = new JsonObject();
		nodes.keySet().forEach(key -> json.add(key, toJson(key)));
		return json;
	}

	public @NotNull JsonElement toJson(@NotNull String key) {
		JsonObject object = new JsonObject();
		DataNode node = nodes.get(key);
		if(node.getFileName() != null) { // should be the case for all
			object.addProperty("filename", node.getFileName());
			object.addProperty("line", node.getLineNumber());
		}
		object.add("data", toJson(node));
		return object;
	}

	/**
	 * Generates a json object with the diff of the two data nodes. If there is no diff, returns null.
	 *
	 * @param oldNode The old node
	 * @param newNode The new node
	 * @return A json object or null. The json object contains:
	 * <ul>
	 *     <li>diff: string; the GNU-style unified diff of the nodes</li>
	 *     <li>added: bool; whether the node was just added</li>
	 *     <li>removed: bool; whether the node was just removed</li>
	 *     <li>modified: if the node was just edited (not added/removed), the list of the top-level node keys that were modified</li>
	 * </ul>
	 */
	private @Nullable JsonObject generateDiff(@Nullable DataNode oldNode, @Nullable DataNode newNode) {
		if(oldNode == null && newNode == null)
			return null;
		List<String> oldString = oldNode == null ? new ArrayList<>() : oldNode.toString().lines().toList();
		List<String> newString = newNode == null ? new ArrayList<>() : newNode.toString().lines().toList();
		Patch<String> patch = getPatch(oldString, newString);
		if(patch.getDeltas().isEmpty())
			return null;
		List<String> unifiedDiff = UnifiedDiffUtils.generateUnifiedDiff(
				oldNode == null ? "???" : oldNode.getName(),
				newNode == null ? "???" : newNode.getName(),
				oldString,
				patch,
				3);
		Set<String> editedTopLevel = new HashSet<>();
		if(oldNode != null && newNode != null) {
			editedTopLevel.addAll(
					getIntersectingNodes(oldString,
					                     patch.getDeltas()
					                          .stream()
					                          .mapMulti((AbstractDelta<String> delta, Consumer<Integer> mapper) ->
					                                    {
						                                    for(int i = delta.getSource().getPosition(); i <= delta.getSource().last(); ++i)
							                                    mapper.accept(i);
					                                    }).collect(Collectors.toSet())));
			editedTopLevel.addAll(
					getIntersectingNodes(newString,
					                     patch.getDeltas()
					                          .stream()
					                          .mapMulti((AbstractDelta<String> delta, Consumer<Integer> mapper) ->
					                                    {
						                                    for(int i = delta.getTarget().getPosition(); i <= delta.getTarget().last(); ++i)
							                                    mapper.accept(i);
					                                    }).collect(Collectors.toSet())));
		}
		JsonObject json = new JsonObject();
		json.addProperty("diff", String.join("\n", unifiedDiff));
		json.addProperty("added", oldNode == null);
		json.addProperty("removed", newNode == null);
		if(!editedTopLevel.isEmpty()) {
			JsonArray array = new JsonArray(editedTopLevel.size());
			editedTopLevel.forEach(array::add);
			json.add("editedTopLevel", array);
		}
		return json;
	}

	/**
	 * Gets the set of direct child node keys that produced any of the given text lines.
	 *
	 * @param text  The next of the node
	 * @param lines The index of the queried lines
	 * @return The child nodes intersecting the lines
	 */
	private @NotNull Set<@NotNull String> getIntersectingNodes(@NotNull List<@NotNull String> text, @NotNull Set<@NotNull Integer> lines) {
		String currentTopLevel = null;
		Set<String> result = new HashSet<>();
		final IndentLevel topLevelIndent = new IndentLevel("    ");
		for(int i = 0; i < text.size(); i++) {
			String s = text.get(i);
			Tokenizer t = Tokenizer.tokenize(s);
			if(t.getIndent().equals(topLevelIndent) && !t.getTokens().isEmpty()) {
				currentTopLevel = t.getTokens().getFirst();
			}
			if(lines.contains(i) && currentTopLevel != null) {
				result.add(currentTopLevel);
			}
		}
		return result;
	}

	private @NotNull Patch<@NotNull String> getPatch(@NotNull List<@NotNull String> oldString, @NotNull List<@NotNull String> newString) {
		return DiffUtils.diff(oldString, newString);
	}

	/**
	 * Saves the value(s) of a node to json.
	 *
	 * @param node
	 * @param json
	 */
	private void saveValues(@NotNull DataNode node, @NotNull JsonObject json) {
		if(node.getValues().isEmpty())
			return;
		json.addProperty("name", node.getValues().getLast());
		if(node.getValues().size() == 2) {
			// base name and variant name
			json.addProperty("base", node.getValues().getFirst());
		}
	}

	/**
	 * Converts a data node into a json object.
	 *
	 * @param node
	 * @return
	 */
	private @NotNull JsonElement toJson(@NotNull DataNode node) {
		JsonObject json = new JsonObject();
		if(!node.getValues().isEmpty()) {
			if(node.getChildren().isEmpty() && node.getValues().size() == 1)
				return new JsonPrimitive(node.getValues().getFirst());
			else
				saveValues(node, json);
		}
		for(DataNode child : node.getChildren()) {
			if(child.getKey() != null) {
				JsonElement element = toJson(child);
				if(json.has(child.getKey())) {
					if(json.get(child.getKey()).isJsonArray())
						json.get(child.getKey()).getAsJsonArray().add(element);
					else {
						JsonArray array = new JsonArray();
						array.add(json.get(child.getKey()));
						array.add(element);
						json.add(child.getKey(), array);
					}
				} else {
					json.add(child.getKey(), element);
				}
			}
		}
		return json;
	}
}
