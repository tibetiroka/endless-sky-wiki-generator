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
import java.util.*;
import java.util.concurrent.Callable;
import java.util.function.Function;

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
	private Map<String, Set<String>> requiredChildren = Map.of("outfit", Set.of("description", "category", "series", "thumbnail"), "ship", Set.of("description"));

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
						parseJson(gson.fromJson(reader, HashMap.class), node.getName(), indices, file.getName());
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

		{
			Index<ReferenceSource> everything = new Index<>("everything");
			indices.values().forEach(index -> index.getEntries().forEach((key, values) -> {
				ReferenceSource source = new ReferenceSource(index.getTopLevelNode(), key);
				everything.addEntry(key, source);
				values.forEach(value -> everything.addEntry(value, source));
			}));
			everything.saveEntries(entryOutput);
		}
		{
			Index<ReferenceSource> displayNames = new Index<>("display name");
			indices.values().forEach(index -> index.getEntries().forEach((key, values) -> {
				ReferenceSource source = new ReferenceSource(index.getTopLevelNode(), key);
				if(values.isEmpty()) {
					displayNames.addEntry(key, source);
				} else {
					displayNames.addEntry(values.stream().findAny().get(), source);
				}
			}));
			displayNames.saveEntries(entryOutput);
		}

		return 0;
	}

	private void addReference(Map<String, Index<String>> indices, String topLevel, String entry, ReferenceSource source) {
		indices.computeIfAbsent(topLevel, Index::new);
		indices.get(topLevel).addReference(entry, source);
	}

	private void addShopReferences(Map<String, Index<String>> indices, String topLevel, ReferenceSource source, Map<String, ?> data) {
		// todo: something with location filters, stock and other magic
		for(String s : data.keySet()) {
			if(!s.equals("name") && !s.equals("to sell") && !s.equals("location") && !s.equals("remove")) {
				addReference(indices, topLevel.equals("shipyard") ? "ship" : "outfit", s, source);
			}
		}
	}

	private void parseJson(HashMap<String, ?> map, String topLevel, Map<String, Index<String>> indices, String fileName) {
		Map<String, ?> data = (Map<String, ?>) map.get("data");

		if(requiredChildren.containsKey(topLevel)) {
			if(requiredChildren.get(topLevel).stream().allMatch(key -> data.get(key) == null)) {
				return;
			}
		}

		ReferenceSource source;
		String name;
		if(topLevel.equals("category")) {
			name = fileName;
			indices.computeIfAbsent(topLevel + '\\' + name, Index::new);
			source = null;
		} else {
			indices.computeIfAbsent(topLevel, Index::new);
			name = (String) ((data).get("name"));
			indices.get(topLevel).addEntry(name);
			source = new ReferenceSource(topLevel, name);

			String displayName = (String) data.get("display name");
			if(displayName != null) {
				indices.get(topLevel).addEntry(name, displayName);
			}
		}

		switch(topLevel) {
			case "outfit" -> {
				String category = (String) data.get("category");
				if(category != null) {
					addReference(indices, "category\\outfit", category, source);
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
					addReference(indices, "category\\series", series, source);
				}
				Map<String, ?> weapon = (Map<String, ?>) data.get("weapon");
				if(weapon != null) {
					Object ammo = weapon.get("ammo");
					if(ammo instanceof String s) {
						addReference(indices, "outfit", s, source);
					} else if(ammo instanceof Map m) {
						String ammoName = (String) m.get("name");
						if(ammoName != null) {
							addReference(indices, "outfit", ammoName, source);
						}
					}
				}
			}
			case "outfitter", "shipyard" -> addShopReferences(indices, topLevel, source, data);
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
						addReference(indices, "category\\ship", category, source);
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
				String series = (String) data.get("series");
				if(series != null) {
					addReference(indices, "category\\series", series, source);
				}
				Object bays = data.get("bay");
				if(bays != null) {
					if(!(bays instanceof List<?>)) {
						bays = List.of(bays);
					}
					for(Object bay : ((List<?>) bays)) {
						if(bay instanceof Map<?, ?> bayMap) {
							addReference(indices, "category\\bay type", (String) bayMap.get("name"), source);
						}
					}
				}
				String base = (String) data.get("base");
				if(base != null) {
					addReference(indices, "ship", base, source);
				}
			}
			case "galaxy", "hazard", "star", "effect", "swizzle" -> {
			}
			case "government" -> {
				String swizzle = (String) data.get("swizzle");
				if(swizzle != null) {
					addReference(indices, "swizzle", swizzle, source);
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

				Object objects = data.get("object");
				Set<String> objectList = new Function<Object, Set<String>>() {
					@Override
					public Set<String> apply(Object o) {
						Set<String> names = new HashSet<>();
						if(o == null) {
							return names;
						}
						if(o instanceof Map<?,?> map) {
							if(map.get("name") != null) {
								names.add((String) map.get("name"));
							}
							if(map.get("object") != null) {
								names.addAll(apply(map.get("object")));
							}
						}
						if(o instanceof List<?> list) {
							for(Object object : list) {
								names.addAll(apply(object));
							}
						}
						return names;
					}
				}.apply(objects);
				for(String s : objectList) {
					addReference(indices, "planet", s, source);
				}
				Object fleets = data.get("fleet");
				if(fleets instanceof Map fleet) {
					String fleetName = (String) fleet.get("name");
					if(fleetName != null) {
						addReference(indices, "fleet", fleetName, source);
					}
				} else if(fleets instanceof List<?> fleetList) {
					for(Object o : fleetList) {
						addReference(indices, "fleet", ((Map<String, String>) o).get("name"), source);
					}
				}
				Object minables = data.get("minables");
				if(minables != null) {
					if(!(minables instanceof List)) {
						minables = List.of(minables);
					}
					for(Object minable : ((List<?>) minables)) {
						addReference(indices, "minable", ((Map<String, String>) minable).get("name"), source);
					}
				}
				Object hazards = data.get("hazard");
				if(hazards != null) {
					if(!(hazards instanceof List)) {
						hazards = List.of(hazards);
					}
					for(Object hazard : ((List<?>) hazards)) {
						addReference(indices, "hazard", ((Map<String, String>) hazard).get("name"), source);
					}
				}
			}
			case "wormhole" -> {
				Object links = data.get("link");
				if(links != null) {
					if(!(links instanceof List)) {
						links = List.of(links);
					}
					for(Object link : ((List<?>) links)) {
						addReference(indices, "system", ((Map<String, String>) link).get("name"), source);
						addReference(indices, "wormhole", source.name(), new ReferenceSource("system", ((Map<String, String>) link).get("name")));
						List<String> values = ((Map<String, List<String>>) link).get("values");
						for(String value : values) {
							addReference(indices, "system", value, source);
							addReference(indices, "wormhole", source.name(), new ReferenceSource("system", value));
						}
					}
				}
			}
			case "landing message" -> {
				data.keySet()
						.stream()
						.filter(key -> !key.equals("name"))
						.forEach(object -> {
							addReference(indices, "landable", object, source);
						});
			}
			case "category" -> {
				data.keySet().forEach(key -> {
					if(!key.equals("name")) {
						indices.get(topLevel + '\\' + name).addEntry(key);
					}
				});
			}
			case "fleet" -> {
				Object variants = data.get("variant");
				if(variants != null) {
					if(!(variants instanceof List<?>)) {
						variants = List.of(variants);
					}
					for(Object variant : ((List<?>) variants)) {
						if(variant instanceof Map<?, ?> bayMap) {
							((Map<?, ?>) variant).forEach((ship, shipData)-> {
								if(!ship.equals("name")) {
									addReference(indices, "ship", (String) ship, source);
								}
							});
						}
					}
				}
			}
		}
	}
}
