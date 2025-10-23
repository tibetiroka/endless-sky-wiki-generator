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

import com.google.gson.*;
import org.jetbrains.annotations.NotNull;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.TreeMap;

public class OutputGenerator {
	private final Map<String, OutputBuffer> outputs;
	private final Map<String, DataManager> storedData = new HashMap<>();

	{
		outputs = new HashMap<>();
		outputs.put("ship", new OutputBuffer());
		outputs.put("outfit", new OutputBuffer());
		outputs.put("system", new OutputBuffer());
		outputs.put("planet", new OutputBuffer());
		outputs.put("shipyard", new OutputBuffer());
		outputs.put("outfitter", new OutputBuffer());
		outputs.put("category", new OutputBuffer());
		outputs.put("fleet", new OutputBuffer());
		outputs.put("government", new OutputBuffer());
		outputs.put("minable", new OutputBuffer());
	}

	public OutputGenerator(@NotNull List<@NotNull DataNode> oldNodes) {
		outputs.forEach((key, _) -> storedData.put(key, new DataManager(oldNodes, key)));
	}

	public void addNewData(@NotNull List<@NotNull DataNode> newNodes, @NotNull CommitInfo commit) {
		outputs.keySet()
		       .stream()
		       .parallel()
		       .forEach(key -> {
			       DataManager newManager = new DataManager(newNodes, key);
			       JsonObject diff = storedData.get(key).generateDiff(newManager);
			       for(Entry<String, JsonElement> entry : diff.entrySet()) {
				       if(entry.getValue().getAsJsonObject().get("removed").getAsBoolean()) {
					       JsonObject removed = storedData.get(key).toJson(entry.getKey()).getAsJsonObject();
					       removed.add("removed", commit.toJson());
					       removed.addProperty("lastCommit", commit.getParent());
					       outputs.get(key).addRemoved(entry.getKey(), removed);
				       }
			       }
			       outputs.get(key).addDiff(diff, commit);
			       storedData.put(key, newManager);
		       });
	}

	public void save(@NotNull File saveDir) {
		outputs.keySet()
		       .stream()
		       .parallel()
		       .forEach(key -> {
			       DataManager data = storedData.get(key);
			       OutputBuffer output = outputs.get(key);
			       output.save(data, new File(saveDir, key));
		       });
		OutputBuffer.saveSharedChangelog(saveDir);
	}

	private static final class OutputBuffer {
		private static final TreeMap<CommitInfo, JsonArray> sharedGlobalChangelog = new TreeMap<>();
		private final HashMap<String, JsonArray> changelogs = new HashMap<>();
		private final JsonArray globalChangelog = new JsonArray();
		private final HashMap<String, JsonElement> removed = new HashMap<>();

		public static void saveSharedChangelog(@NotNull File saveDir) {
			JsonArray array = new JsonArray(sharedGlobalChangelog.size());
			sharedGlobalChangelog.forEach((commit, diff) -> {
				JsonObject diffObject = new JsonObject();
				diffObject.add("diff", diff);
				diffObject.add("commit", commit.toJson());
				array.add(diffObject);
			});
			save(array, new File(saveDir, "changelog.json"));
		}

		private static void save(@NotNull JsonElement data, @NotNull File file) {
			file.getParentFile().mkdirs();
			try(BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
				Gson gson = new GsonBuilder().setFormattingStyle(FormattingStyle.PRETTY).create();
				gson.toJson(data, writer);
			} catch(IOException e) {
				throw new RuntimeException(e);
			}
		}

		public void addDiff(@NotNull JsonObject diff, @NotNull CommitInfo commit) {
			if(!diff.isEmpty()) {
				JsonObject diffObject = new JsonObject();
				diffObject.add("diff", diff);
				diffObject.add("commit", commit.toJson());
				globalChangelog.add(diffObject);
				synchronized(OutputBuffer.class) {
					sharedGlobalChangelog.putIfAbsent(commit, new JsonArray());
					for(String s : diff.keySet()) {
						sharedGlobalChangelog.lastEntry().getValue().add(diff.get(s));
					}
				}

				for(String s : diff.keySet()) {
					changelogs.putIfAbsent(s, new JsonArray());

					diffObject = new JsonObject();
					diffObject.add("diff", diff.get(s));
					diffObject.add("commit", commit.toJson());
					changelogs.get(s).add(diffObject);
				}
			}
		}

		public void addRemoved(@NotNull String key, @NotNull JsonObject node) {
			removed.put(key, node);
		}

		public void save(@NotNull DataManager newData, @NotNull File saveDir) {
			save(globalChangelog, new File(saveDir, "changelog.json"));

			File changelogDir = new File(saveDir, "changelog");
			changelogs.forEach((name, data) -> save(data, new File(changelogDir, name)));

			File dataDir = new File(saveDir, "data");
			removed.forEach((key, data) -> save(data, new File(dataDir, key)));
			JsonObject data = newData.toJson();
			for(String key : data.keySet()) {
				save(data.get(key), new File(dataDir, key));
			}
		}
	}
}
