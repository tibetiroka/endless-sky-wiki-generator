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

import com.google.gson.Gson;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.jetbrains.annotations.Nullable;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

public class Main {
	public static void main(String[] args) throws IOException, GitAPIException {
		if(args.length != 3) {
			System.err.println("Usage: animation-creator <wiki-generated-dir> <repository-dir> <output-dir>");
			System.exit(1);
		}
		File data = new File(args[0]);
		File repo = new File(args[1]);
		File output = new File(args[2]);

		if(!repo.exists()) {
			try(Git git = Git.cloneRepository().setDirectory(repo).setURI("https://github.com/endless-sky/endless-sky.git").call()) {
			}
		}
		try(Git git = Git.open(repo)) {
			git.checkout().setName("master").call();
		}

		HashMap<String, List<File>> frames = findFrames(new File(data, "files.json"), repo);
		HashMap<String, Animation> animations = findAnimations(data);
		createAnimations(output, frames, animations, new File(repo, "images/outfit/unknown.png"));
	}

	private static void createAnimation(Animation animation, List<File> usedFrames, File defaultFile, File outputFile) {
		if(usedFrames == null) {
			usedFrames = List.of(defaultFile);
		}

		if(animation.startFrame != 0) {
			ArrayList<File> reorderedFrames = new ArrayList<>();
			reorderedFrames.addAll(usedFrames.subList(Math.min(animation.startFrame, usedFrames.size() - 1), usedFrames.size()));
			reorderedFrames.addAll(usedFrames.subList(0, Math.min(animation.startFrame, usedFrames.size())));
			usedFrames = reorderedFrames;
		}
		if(animation.rewind) {
			ArrayList<File> repeatedFrames = new ArrayList<>();
			repeatedFrames.addAll(usedFrames);
			repeatedFrames.addAll(usedFrames.subList(0, usedFrames.size() - 1).reversed());
			if(usedFrames.size() == 1) {
				repeatedFrames.add(usedFrames.getFirst());
			}
			usedFrames = repeatedFrames;
		}

		if(usedFrames.size() <= 1) {
			if(!usedFrames.isEmpty()) {
				try {
					outputFile.getParentFile().mkdirs();
					Files.copy(usedFrames.getFirst().toPath(), outputFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
				} catch(IOException e) {
					throw new RuntimeException(e);
				}
			}
		} else {
			List<String> command = new ArrayList<>();
			command.add("ffmpeg");
			command.add("-loglevel");
			command.add("warning");
			command.add("-y");
			command.add("-r");
			command.add(Double.toString(1. / animation.timePerFrame));
			for(File frame : usedFrames) {
				boolean isVideo = switch(frame.getName().substring(frame.getName().lastIndexOf('.'))) {
					case ".avi", ".avif" -> true;
					default -> false;
				};
				if(!isVideo) {
					command.add("-t");
					command.add(Double.toString(animation.timePerFrame));
				}
				command.add("-i");
				command.add(frame.getAbsolutePath());
			}
			command.add("-filter_complex");
			int frameCount = usedFrames.size();
			command.add(String.join("", IntStream.range(0, frameCount).mapToObj(
					i -> {
						if(animation.rewind && frameCount == 2 && i == 1) {
							return "[1:v]setsar=sar=1,reverse[out1];";
						}
						return "[" + i + ":v]setsar=sar=1[out" + i + "];";
					}).toList())
			            + String.join("", IntStream.range(0, frameCount).mapToObj(
					i -> "[out" + i + "]").toList())
			            + "concat=n=" + frameCount + ":v=1:a=0[out]");
			command.add("-map");
			command.add("[out]");
			command.add("-loop");
			command.add("0");
			command.add("-framerate");
			command.add(Double.toString(1. / animation.timePerFrame));

			File output = new File(outputFile.getParentFile(), outputFile.getName() + ".webp");
			output.getParentFile().mkdirs();
			command.add(output.getAbsolutePath());
			try {
				System.out.println(String.join(" ", command));
				int code = new ProcessBuilder(command)
						.inheritIO()
						.start()
						.waitFor();
				if(code != 0) {
					System.exit(code);
				}
				Files.move(output.toPath(), outputFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
			} catch(IOException | InterruptedException e) {
				throw new RuntimeException(e);
			}
		}
	}

	private static void createAnimations(File outputDir, HashMap<String, List<File>> frames, HashMap<String, Animation> animations, File defaultFile) {
		if(!outputDir.exists()) {
			outputDir.mkdirs();
		}

		animations
				.entrySet()
				.stream()
				.parallel()
				.forEach(entry -> {
					createAnimation(entry.getValue(), frames.get(entry.getValue().name), defaultFile, new File(outputDir, entry.getKey()));
				});
		frames
				.entrySet()
				.stream()
				.parallel()
				.forEach(entry -> {
					String name = entry.getKey();
					if(entry.getKey().contains(".")) {
						name = name.substring(0, name.lastIndexOf('.'));
					}
					createAnimation(new Animation(entry.getKey()), entry.getValue(), defaultFile, new File(outputDir, "everything/" + name));
				});
	}

	private static String encode(String text) {
		return text.replace('/', '$');
	}

	private static HashMap<String, Animation> findAnimations(File data) throws IOException {
		String[] types = new String[]{"ship", "outfit", "planet", "minable", "effect", "galaxy", "star"};
		String[] entries = new String[]{"sprite", "thumbnail", "landscape", "icon"};

		HashMap<String, Animation> animations = new HashMap<>();
		for(String type : types) {
			File typeData = new File(new File(data, type), "data");
			if(typeData.exists() && typeData.isDirectory()) {
				for(File file : typeData.listFiles()) {
					try(BufferedReader reader = new BufferedReader(new FileReader(file))) {
						Map json = new Gson().fromJson(reader, Map.class);
						Map jsonData = (Map) json.get("data");
						String name = encode((String) jsonData.get("name"));
						for(String entry : entries) {
							if(jsonData.containsKey(entry)) {
								String fullName = type + "/" + name + "/" + entry;
								animations.put(fullName, new Animation(jsonData.get(entry)));
							}
						}
						if(isSpriteType(type)) {
							animations.put(type + "/" + name + "/sprite", new Animation(jsonData.get("name")));
						}
					}
				}
			}
		}
		return animations;
	}

	private static HashMap<String, List<@Nullable File>> findFrames(File fileList, File repository) throws IOException {
		HashMap<String, List<File>> frames = new HashMap<>();

		try(BufferedReader reader = new BufferedReader(new FileReader(fileList))) {
			String[] files = new Gson().fromJson(reader, String[].class);
			File imageDir = new File(repository, "images");
			for(String relativePath : files) {
				File file = new File(repository, relativePath);
				if(file.isFile() && file.getName().contains(".") && file.toPath().startsWith(imageDir.toPath())) {
					ImageFileData data = new ImageFileData(file, imageDir);
					if(data.isImage) {
						frames.putIfAbsent(data.name, new ArrayList<>());
						List<File> animationFiles = frames.get(data.name);
						while(data.frameNumber >= animationFiles.size()) {
							animationFiles.add(null);
						}
						animationFiles.set(data.frameNumber, data.file);
					}
				}
			}
		}
		return frames;
	}

	private static boolean isSpriteType(String type) {
		return type.equals("star");
	}
}
