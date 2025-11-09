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

import com.google.gson.FormattingStyle;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ResetCommand.ResetType;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.Constants;
import org.eclipse.jgit.lib.ObjectId;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.revwalk.RevCommit;
import org.eclipse.jgit.revwalk.RevSort;
import org.eclipse.jgit.revwalk.RevWalk;
import org.eclipse.jgit.transport.TagOpt;
import org.jetbrains.annotations.NotNull;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileStore;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.AbstractMap.SimpleEntry;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Main {
	private static int MAX_GIT_INSTANCES = Runtime.getRuntime().availableProcessors();

	public static void main(String[] args) throws Exception {
		System.setProperty("java.util.concurrent.ForkJoinPool.common.parallelism", "" + Runtime.getRuntime().availableProcessors());

		// Check output dir
		File tmp = new File(System.getProperty("java.io.tmpdir"));
		System.out.println("Output will be generated in " + tmp);
		if(!isInMemory(tmp.toPath())) {
			System.err.println("The output directory could not be determined to be in memory. I/O may be severely bottlenecked. It is highly recommended to not continue.");
			System.err.println("Execution will resume in 10 seconds. You have been warned.");
			MAX_GIT_INSTANCES = 1;
			Thread.sleep(10000);
		}

		// Clone the game
		List<File> repositories = new ArrayList<>();
		repositories.add(new File(tmp, "endless-sky"));

		if(repositories.getFirst().exists()) {
			System.out.println("Fetching latest commits");
			try(Git git = Git.open(repositories.getFirst())) {
				git.reset().setMode(ResetType.HARD).setRef("origin/master").call();
				git.pull().setRemoteBranchName("master").setTagOpt(TagOpt.FETCH_TAGS).call();
			} catch(Exception e) {
				throw new RuntimeException(e);
			}
		} else {
			System.out.println("Cloning endless-sky/endless-sky.git");
			try(Git _ = Git.cloneRepository().setURI("https://github.com/endless-sky/endless-sky.git").setDirectory(repositories.getFirst()).call()) {
			}
		}

		Instant start = Instant.now();

		// Copy the repository in memory if we have enough space.
		try(Stream<Path> paths = Files.walk(repositories.getFirst().toPath())) {
			long repoSize = paths.parallel()
			                     .map(Path::toFile)
			                     .filter(File::isFile)
			                     .mapToLong(File::length)
			                     .sum();
			long fsSize = getAvailableSpace(repositories.getFirst().toPath());
			long maxRepos = Math.min((long) ((fsSize * 0.8) / repoSize), MAX_GIT_INSTANCES);
			System.out.println("Using " + maxRepos + " repositories");
			while(repositories.size() < maxRepos) {
				repositories.add(new File(repositories.getLast().getParentFile(), repositories.getLast().getName() + "_"));
				if(!repositories.getLast().exists()) {
					Path source = repositories.getFirst().toPath();
					Path target = repositories.getLast().toPath();
					try(Stream<Path> stream = Files.walk(source)) {
						stream.forEach(file -> {
							try {
								Files.copy(file, target.resolve(source.relativize(file)));
							} catch(IOException e) {
								throw new RuntimeException(e);
							}
						});
					} catch(IOException e) {
						throw new RuntimeException(e);
					}
				}
			}
		}

		// Get all relevant commits and parse the commit data
		List<RevCommit> commitList;
		Map<RevCommit, CommitInfo> commitInfo;
		try(Git git = Git.open(repositories.getFirst())) {
			List<RevCommit> commits = listCommits(git);
			Map<Ref, Integer> tags = git.tagList()
			                            .call()
			                            .stream()
			                            .collect(Collectors.toMap(r -> r, ref -> {
				                            try(RevWalk revWalk = new RevWalk(git.getRepository())) {
					                            ObjectId peeledId = ref.getPeeledObjectId();
					                            if(peeledId == null) {
						                            peeledId = ref.getObjectId();
					                            }
					                            RevCommit peeled = revWalk.parseCommit(peeledId);
					                            return peeled.getCommitTime();
				                            } catch(IOException e) {
					                            throw new RuntimeException(e);
				                            }
			                            }));
			commitInfo = commits.stream()
			                    .parallel()
			                    .collect(Collectors.toMap(commit -> commit, commit -> new CommitInfo(commit, tags)));
			System.out.println("Found " + commits.size() + " commits");
			if(commits.isEmpty())
				return;

			commitList = Collections.synchronizedList(new ArrayList<>(commits.reversed()));
		}

		OutputGenerator output = new OutputGenerator(new ArrayList<>());
		BlockingQueue<Future<List<DataNode>>> parsingTasks = new LinkedBlockingQueue<>();
		BlockingQueue<RevCommit> parsedCommits = new LinkedBlockingQueue<>();
		List<String> files = new ArrayList<>();

		// Go through all commits and parse the data files.
		final CyclicBarrier parserSync = new CyclicBarrier(repositories.size());
		final Future<List<DataNode>>[] tempParsingTasks = new Future[repositories.size()];
		List<Thread> parserThreads =
				repositories
						.stream()
						.map(file ->
								     Thread.ofPlatform().name("Parser thread for " + file.getName()).start(() -> {
									     try {
										     final int threadIndex = parserSync.await();
										     File dataDir = new File(file, "data");
										     try(Git git = Git.open(file)) {
											     // Get the next commit. The order is deterministic so we can restore the commit order after parsing.
											     // commitList is reversed, so the first thread takes the last element, which should be the first in the output.
											     while(!commitList.isEmpty()) {
												     if(threadIndex < commitList.size()) {
													     RevCommit commit = commitList.get(commitList.size() - threadIndex - 1);
													     checkout(git, commit);

													     List<@NotNull CompletableFuture<@NotNull List<@NotNull DataNode>>> nodePromises = readData(dataDir);
													     tempParsingTasks[threadIndex] = CompletableFuture.supplyAsync(() -> {
														     ArrayList<DataNode> nodes = new ArrayList<>();
														     for(CompletableFuture<@NotNull List<@NotNull DataNode>> promise : nodePromises) {
															     try {
																     nodes.addAll(promise.get());
															     } catch(InterruptedException | ExecutionException e) {
																     throw new RuntimeException(e);
															     }
														     }
														     return nodes;
													     });
														 if(threadIndex == commitList.size() - 1) {
															 files.addAll(listFiles(file, new String[]{"images", "sounds"}));
														 }
												     }
												     parserSync.await();
												     if(threadIndex == 0) {
													     int entryCount = Math.min(commitList.size(), repositories.size());
													     for(int i = 0; i < entryCount; i++) {
														     RevCommit commit = commitList.removeLast();
														     parsedCommits.put(commit);
														     parsingTasks.put(tempParsingTasks[i]);
													     }
												     }
												     parserSync.await();
											     }
										     }
									     } catch(Exception e) {
										     throw new RuntimeException(e);
									     }
								     })
						).toList();

		// Begin processing each commit's data
		AtomicBoolean terminated = new AtomicBoolean(false);
		Thread dataThread = new Thread(() -> {
			while(!terminated.get() || !parsingTasks.isEmpty()) {
				try {
					Future<List<DataNode>> parseTask = parsingTasks.poll(1, TimeUnit.SECONDS);
					if(parseTask != null) {
						RevCommit commit = parsedCommits.remove();
						System.out.println(commit);
						output.addNewData(parseTask.get(), commitInfo.get(commit));
					}
				} catch(InterruptedException | ExecutionException e) {
					throw new RuntimeException(e);
				}
			}
		}, "Data thread");
		dataThread.start();

		for(Thread parserThread : parserThreads) {
			parserThread.join();
		}
		terminated.set(true);

		repositories
				.subList(1, repositories.size())
				.stream()
				.parallel()
				.forEach(file -> {
					try(Stream<Path> items = Files.walk(file.toPath())) {
						items.toList()
						     .reversed()
						     .forEach(path -> path.toFile().delete());
					} catch(IOException e) {
						throw new RuntimeException(e);
					}
				});

		dataThread.join();
		output.save(new File(tmp, "es-wiki-diff"));
		saveFiles(files, new File(tmp, "es-wiki-diff"));
		Instant end = Instant.now();
		System.out.println("Runtime: " + (end.toEpochMilli() - start.toEpochMilli()) / 1000.0f + "s");
	}

	private static void checkout(@NotNull Git git, @NotNull RevCommit commit) throws GitAPIException {
		git.reset().setRef(ObjectId.toString(commit.toObjectId())).setMode(ResetType.HARD).call();
	}

	private static long getAvailableSpace(Path path) {
		try {
			FileStore store = Files.getFileStore(path);
			return store.getUsableSpace();
		} catch(Exception e) {
			return 0;
		}
	}

	private static boolean isInMemory(Path path) {
		try {
			FileStore store = Files.getFileStore(path);
			String type = store.type().toLowerCase();
			return type.equals("tmpfs")
			       || type.equals("ramfs")
			       || type.equals("devtmpfs")
			       || type.equals("shm")
			       || type.contains("memory");
		} catch(Exception e) {
			return false;
		}
	}

	private static @NotNull List<@NotNull RevCommit> listCommits(@NotNull Git git) throws IOException, GitAPIException {
		List<RevCommit> commits = new ArrayList<>();
		git.log().addPath("data").call().iterator().forEachRemaining(commits::add);

		Map<RevCommit, Integer> commitIndices = new HashMap<>();
		try(RevWalk revWalk = new RevWalk(git.getRepository())) {
			revWalk.sort(RevSort.TOPO_KEEP_BRANCH_TOGETHER);
			revWalk.setFirstParent(true);
			revWalk.markStart(revWalk.parseCommit(git.getRepository().resolve(Constants.HEAD)));
			List<RevCommit> allCommits = new ArrayList<>();
			revWalk.iterator().forEachRemaining(allCommits::add);
			for(int i = 0; i < allCommits.size(); i++) {
				commitIndices.put(allCommits.get(i), i);
			}
		}
		commits = commits.stream()
		                 .filter(commitIndices::containsKey)
		                 .sorted(Comparator.comparingInt(commitIndices::get).reversed())
		                 .toList();
		return commits;
	}

	private static @NotNull List<String> listFiles(@NotNull File basedir, @NotNull String @NotNull [] directories) throws IOException {
		ArrayList<String> files = new ArrayList<>();
		Path basePath = basedir.toPath();
		for(String directory : directories) {
			File dir = new File(basedir, directory);
			if(dir.exists() && dir.isDirectory()) {
				try(Stream<Path> paths = Files.walk(dir.toPath())) {
					files.addAll(paths.parallel()
					                  .filter(path -> path.toFile().isFile())
					                  .map(path -> basePath.relativize(path).toString())
					                  .toList());
				}
			}
		}
		return files;
	}

	private static @NotNull List<@NotNull CompletableFuture<@NotNull List<@NotNull DataNode>>> readData(@NotNull File baseDir) throws IOException {
		try(Stream<Path> paths = Files.walk(baseDir.toPath())) {
			return paths.parallel()
			            .filter(p -> p.toFile().isFile())
			            .map(path -> {
				            try {
					            ListIterator<String> textIt = Files.readAllLines(path, StandardCharsets.ISO_8859_1).listIterator();
					            String filename = baseDir.toPath().relativize(path).toString();
					            return new SimpleEntry<>(filename, textIt);
				            } catch(IOException e) {
					            throw new RuntimeException(e);
				            }
			            }).map(entry -> CompletableFuture.supplyAsync(() -> {
						List<DataNode> nodes = new ArrayList<>();
						while(entry.getValue().hasNext()) {
							int lineNumber = entry.getValue().nextIndex() + 1;
							DataNode node = new DataNode(entry.getValue());
							node.setFilePos(entry.getKey(), lineNumber);
							if(!node.isEmpty()) {
								nodes.add(node);
							}
						}
						return nodes;
					})).toList();
		}
	}

	private static void saveFiles(List<String> files, File directory) throws IOException {
		JsonArray fileArray = new JsonArray();
		files.sort(String::compareTo);
		for(String file : files) {
			fileArray.add(file);
		}
		try(BufferedWriter writer = new BufferedWriter(new FileWriter(new File(directory, "files.json")))) {
			Gson gson = new GsonBuilder().setFormattingStyle(FormattingStyle.PRETTY).create();
			gson.toJson(fileArray, writer);
		}
	}
}
