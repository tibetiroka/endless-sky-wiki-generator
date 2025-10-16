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

import com.google.gson.Gson;
import org.jetbrains.annotations.Nullable;
import picocli.CommandLine;
import picocli.CommandLine.Option;
import picocli.CommandLine.Parameters;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Callable;

public class Main implements Callable<Integer> {
	@Parameters(index = "0", description = "The directory where the auto-generated JSON files are located.")
	private File generatedInput;
	@Option(names = {"-h", "--help"}, usageHelp = true, description = "Display this help message and exit.")
	private boolean helpRequested = false;
	@Option(names = {"-m", "--manual-input"}, description = "The directory where the hand-made wiki files are located.")
	private @Nullable File manualInput = null;
	@Parameters(index = "1", description = "The directory where the JSON indices should be generated.")
	private File output;
	@Option(names = {"-c", "--required-children"}, description = "Required children for top-level nodes to be indexed in the auto-generated data.")
	private Map<String, Set<String>> requiredChildren = Map.of("outfit", Set.of("description"), "ship", Set.of("description"));

	public static void main(String[] args) {
		int exitCode = new CommandLine(new Main()).execute(args);
		System.exit(exitCode);
	}

	@Override
	public Integer call() throws Exception {
		if(!generatedInput.exists()) {
			System.err.println("Generated input directory doesn't exist");
			return 1;
		} else if(manualInput != null && !manualInput.exists()) {
			System.err.println("Manual input directory doesn't exist");
			return 2;
		} else if(!output.exists()) {
			if(!output.mkdir()) {
				System.err.println("Output directory doesn't exist and cannot be created");
				return 3;
			}
		}

		Map<String, Index<String>> indices = new HashMap<>();

		File[] nodes = generatedInput.listFiles();
		for(File node : nodes) {
			File sourceDir = new File(node, "data");
			File[] files = sourceDir.listFiles();
			if(files != null) {
				for(File file : files) {
					Gson gson = new Gson();
					try(BufferedReader reader = new BufferedReader(new FileReader(file))) {
						parseJson(gson.fromJson(reader, HashMap.class), node.getName(), indices);
					}
				}
			}
		}
		if(manualInput != null) {
			File[] files = manualInput.listFiles();
			if(files != null) {
				for(File node : files) {
					if(node.isDirectory()) {
						String[] entries = node.list();
						if(entries.length > 0) {
							indices.computeIfAbsent(node.getName(), Index::new);
						}
						for(String entry : entries) {
							indices.get(node.getName()).addEntry(entry);
						}
					}
				}
			}
		}

		File entryOutput = new File(output, "entries");
		File referenceOutput = new File(output, "references");
		entryOutput.mkdir();
		referenceOutput.mkdir();
		for(Index<String> stringIndex : indices.values()) {
			stringIndex.saveEntries(entryOutput);
			stringIndex.saveReferences(referenceOutput);
		}

		Index<ReferenceSource> everything = new Index<>("everything");
		indices.values().forEach(index -> index.getEntries().forEach((key, values) -> {
			ReferenceSource source = new ReferenceSource(index.getTopLevelNode(), key);
			everything.addEntry(key, source);
			values.forEach(value -> everything.addEntry(value, source));
		}));
		everything.saveEntries(entryOutput);
		return 0;
	}

	private void addReference(Map<String, Index<String>> indices, String topLevel, String entry, ReferenceSource source) {
		indices.computeIfAbsent(topLevel, Index::new);
		indices.get(topLevel).addReference(entry, source);
	}

	private void parseJson(HashMap<String, ?> map, String topLevel, Map<String, Index<String>> indices) {
		Map<String, ?> data = (Map<String, ?>) map.get("data");
		String name = (String) ((data).get("name"));

		if(requiredChildren.containsKey(topLevel)) {
			for(String key : requiredChildren.get(topLevel)) {
				if(data.get(key) == null) {
					return;
				}
			}
		}

		indices.computeIfAbsent(topLevel, Index::new);
		indices.get(topLevel).addEntry(name);
		ReferenceSource source = new ReferenceSource(topLevel, name);

		String plural = (String) data.get("plural");
		if(plural != null) {
			indices.get(topLevel).addEntry(name, plural);
		}
		String displayName = (String) data.get("display name");
		if(displayName != null) {
			indices.get(topLevel).addEntry(name, displayName);
		}

		switch(topLevel) {
			case "outfit" -> {
				String category = (String) data.get("category");
				if(category != null) {
					addReference(indices, "category", category, source);
				}
				Object licenses = data.get("licenses");
				if(licenses instanceof Map<?, ?> licenseMap) {
					for(Object license : licenseMap.keySet()) {
						addReference(indices, "license", (String) license, source);
					}
				} else if(licenses instanceof String license) {
					addReference(indices, "license", license, source);
				}
				String series = (String) data.get("series");
				if(series != null) {
					addReference(indices, "series", series, source);
				}
				Map<String, ?> weapon = (Map<String, ?>) data.get("weapon");
				if(weapon != null) {
					Object ammo = weapon.get("ammo");
					if(ammo instanceof String s) {
						addReference(indices, "outfit", s, source);
					} else if(ammo instanceof Map m) {
						String base = (String) m.get("base");
						if(base != null) {
							addReference(indices, "outfit", base, source);
						}
					}
				}
			}
			case "outfitter" -> {
				for(String s : data.keySet()) {
					if(!s.equals("name")) {
						addReference(indices, "outfit", s, source);
					}
				}
			}
			case "planet" -> {
				Object outfitters = data.get("outfitter");
				if(outfitters instanceof String s) {
					addReference(indices, "outfitter", s, source);
				} else if(outfitters instanceof List<?> list) {
					for(Object o : list) {
						addReference(indices, "outfitter", (String) o, source);
					}
				}
				Object shipyards = data.get("shipyard");
				if(shipyards instanceof String s) {
					addReference(indices, "shipyard", s, source);
				} else if(shipyards instanceof List<?> list) {
					for(Object o : list) {
						addReference(indices, "shipyard", (String) o, source);
					}
				}
				String government = (String) data.get("government");
				if(government != null) {
					addReference(indices, "government", government, source);
				}
			}
			case "ship" -> {
				Map<String, ?> attributes = (Map<String, ?>) data.get("attributes");
				if(attributes != null) {
					String category = (String) attributes.get("category");
					if(category != null) {
						addReference(indices, "category", category, source);
					}
					Map<String, ?> licenses = (Map<String, ?>) attributes.get("licenses");
					if(licenses != null) {
						for(String license : licenses.keySet()) {
							addReference(indices, "license", license, source);
						}
					}
				}
				Map<String, ?> outfits = (Map<String, ?>) data.get("outfits");
				if(outfits != null) {
					for(String outfit : outfits.keySet()) {
						addReference(indices, "outfit", outfit, source);
					}
				}
			}
			case "shipyard" -> {
				for(String s : data.keySet()) {
					if(!s.equals("name")) {
						addReference(indices, "ship", s, source);
					}
				}
			}
			case "system" -> {
				String government = (String) data.get("government");
				if(government != null) {
					addReference(indices, "government", government, source);
				}
				Object link = data.get("link");
				if(link instanceof String system) {
					addReference(indices, "system", system, source);
				} else if(link instanceof List<?> list) {
					for(Object o : list) {
						addReference(indices, "system", (String) o, source);
					}
				}
				Map<String, ?> objects = (Map<String, ?>) data.get("objects");
				if(objects != null) {
					for(Object value : objects.values()) {
						if(value instanceof Map object) {
							if(object.containsKey("name")) {
								addReference(indices, "planet", (String) object.get("name"), source);
							}
						}
					}
				}
				Object fleets = data.get("fleet");
				if(fleets instanceof Map fleet) {
					String base = (String) fleet.get("base");
					if(base != null) {
						addReference(indices, "fleet", base, source);
					}
				} else if(fleets instanceof List<?> fleetList) {
					for(Object o : fleetList) {
						addReference(indices, "fleet", ((Map<String, String>) o).get("base"), source);
					}
				}
			}
		}
	}
}
