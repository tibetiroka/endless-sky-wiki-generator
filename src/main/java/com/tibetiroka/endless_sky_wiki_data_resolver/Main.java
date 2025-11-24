package com.tibetiroka.endless_sky_wiki_data_resolver;

import com.google.gson.Gson;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public class Main {
	public static void main(String[] args) throws IOException {
		if(args.length != 1) {
			throw new IllegalArgumentException("Usage: endless-sky-wiki-data-resolver <data_dir>");
		}

		File dataDir = new File(args[0]);
		resolveShips(new File(new File(dataDir, "ship"), "data"), new File(new File(dataDir, "outfit"), "data"));
	}

	private static void resolveShipCosts(List<Data> ships, List<File> files, File outfitDir) throws IOException {
		Map<String, Data> outfitsByName =
				Arrays.stream(outfitDir.listFiles())
				      .parallel()
				      .map(file -> {
					      try(BufferedReader reader = new BufferedReader(new FileReader(file))) {
						      return new Gson().fromJson(reader, Data.class);
					      } catch(IOException e) {
						      throw new RuntimeException(e);
					      }
				      })
				      .collect(Collectors.toMap(d -> (String) d.data.get("name"), d -> d));

		ships.stream()
		     .parallel()
		     .forEach(ship -> {
			     Map<String, String> attributes = (Map<String, String>) ship.data.get("attributes");
			     double cost = 0;
			     if(attributes != null) {
				     cost = Double.parseDouble(attributes.getOrDefault("cost", "0"));
				     Map<String, Object> outfits = (Map<String, Object>) ship.data.get("outfits");
				     if(outfits != null) {
					     cost += outfits.entrySet()
					                    .stream()
					                    .mapToDouble(entry -> {
						                    int count = entry.getValue() instanceof String ? Integer.parseInt((String) entry.getValue()) : 1;
						                    Data outfit = outfitsByName.get(entry.getKey());
						                    if(outfit == null) {
							                    return 0;
						                    }
						                    double outfitCost = Double.parseDouble((String) outfit.data.getOrDefault("cost", "0"));
						                    return count * outfitCost;
					                    }).sum();
				     }
			     }
			     ship.data.put("total cost", cost);
		     });
		for(int i = 0; i < ships.size(); i++) {
			ships.get(i).toJson(files.get(i));
		}
	}

	private static void resolveShips(File shipDir, File outfitDir) throws IOException {
		List<File> files = Arrays.stream(shipDir.listFiles()).filter(File::isFile).toList();
		// Resolve each ships' missing attributes from its parent. When done, resolve the total cost of each ship's equipment.
		while(true) {
			List<Data> ships = files.stream()
			                        .parallel()
			                        .map(file -> {
				                        try(BufferedReader reader = new BufferedReader(new FileReader(file))) {
					                        return new Gson().fromJson(reader, Data.class);
				                        } catch(IOException e) {
					                        throw new RuntimeException(e);
				                        }
			                        })
			                        .toList();
			Map<String, Data> shipsByName = ships.stream()
			                                     .parallel()
			                                     .collect(Collectors.toMap(Data::name, s -> s));

			boolean allResolved = ships.stream().allMatch(s -> s.resolved);
			if(allResolved) {
				resolveShipCosts(ships, files, outfitDir);
				return;
			}

			// Resolve ship data
			ships.stream()
			     .parallel()
			     .filter(ship -> !ship.resolved)
			     .forEach(ship -> {
				     String base = ship.base();
				     if(base == null) {
					     ship.resolved = true;
				     } else {
					     Data parent = shipsByName.get(base);
					     if(parent == null) {
						     ship.resolved = true;
					     } else if(parent.resolved) {
						     // Resolve missing entries
						     parent.data.forEach((key, value) -> {
							     if(!ship.data.containsKey(key)) {
									 if(value instanceof Map m) {
										 ship.data.put(key, new HashMap<>(m));
									 } else if(value.getClass().isArray()) {
										 ship.data.put(key, Arrays.copyOf((Object[])value, ((Object[]) value).length));
									 } else if(value instanceof List l) {
										 ship.data.put(key, new ArrayList(l));
									 } else if(value instanceof String s) {
										 ship.data.put(key, s);
									 } else {
										 throw new IllegalArgumentException("Could not copy unexpected type " + value.getClass().getCanonicalName());
									 }
							     }
						     });

						     // Remove bays
						     if(ship.data.containsKey("remove")) {
							     Consumer<Object> removeSingle = removed -> {
								     if(removed instanceof String removedString) {
									     switch(removedString) {
										     case "bays" -> ship.data.remove("bay");
										     default -> System.err.println("Warning: failed to remove unknown keyword from ship: " + removedString);
									     }
								     } else {
									     System.err.println("Warning: failed to remove unknown type from ship: " + removed);
								     }
							     };
							     if(ship.data.get("remove").getClass().isArray()) {
								     for(Object removed : ((Object[]) ship.data.get("remove"))) {
									     removeSingle.accept(removed);
								     }
							     } else {
								     removeSingle.accept(ship.data.get("remove"));
							     }
							     ship.data.remove("remove");
						     }

						     // Add extra attributes
						     if(ship.data.containsKey("add")) {
							     Consumer<Object> addSingle = added -> {
								     if(added instanceof Map addedMap) {
									     switch((String) addedMap.get("name")) {
										     case null -> {
										     }
										     case "attributes" -> {
											     if(!ship.data.containsKey("attributes")) {
												     ship.data.put("attributes", new HashMap<>());
											     }
											     Map<String, String> attributes = (Map<String, String>) ship.data.get("attributes");
											     addedMap.forEach((key, value) -> {
												     if(!key.equals("name")) {
													     double attributeValue = Double.parseDouble((String) value);
													     double previousValue = Double.parseDouble(attributes.getOrDefault(key, "0"));
													     attributes.put((String) key, Double.toString(attributeValue + previousValue));
												     }
											     });
										     }
										     default -> System.err.println("Warning: failed to add unknown keyword from ship: " + addedMap.get("name"));
									     }
								     } else {
									     System.err.println("Warning: failed to remove unknown type from ship: " + added);
								     }
							     };
							     if(ship.data.get("add").getClass().isArray()) {
								     for(Object added : ((Object[]) ship.data.get("add"))) {
									     addSingle.accept(added);
								     }
							     } else {
								     addSingle.accept(ship.data.get("add"));
							     }
							     ship.data.remove("add");
						     }

						     ship.resolved = true;
					     }
				     }
			     });

			// Save ship data
			for(int i = 0; i < ships.size(); i++) {
				ships.get(i).toJson(files.get(i));
			}
		}
	}
}
