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

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Main {
	// example hash: 168f3d7b41f6a76447e4e1921abb547bdcd55d0c
	public static void main(String[] args) {
		System.setProperty("java.util.concurrent.ForkJoinPool.common.parallelism", "" + Runtime.getRuntime().availableProcessors() * 2);
		Config config = new Config(args);
		File dataDir = new File(config.repository, "data");
		Instant start = Instant.now();
		OutputGenerator output = new OutputGenerator(new ArrayList<>());
		Future<Void> dataTask = null;
		if(!config.repository.exists()) {
			try(Git _ = Git.cloneRepository().setURI("https://github.com/endless-sky/endless-sky.git").setDirectory(config.repository).call()) {
			} catch(GitAPIException e) {
				throw new RuntimeException(e);
			}
		}
		try(Git git = Git.open(config.repository)) {
			git.reset().setMode(ResetType.HARD).setRef("origin/master").call();
			git.pull().setRemoteBranchName("master").setTagOpt(TagOpt.FETCH_TAGS).call();
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
			Map<RevCommit, CommitInfo> commitInfo = commits.stream()
			                                               .parallel()
			                                               .collect(Collectors.toMap(commit -> commit, commit -> new CommitInfo(commit, tags)));
			System.out.println("Found " + commits.size() + " commits");
			if(commits.isEmpty())
				return;

			for(RevCommit commit : commits) {
				checkout(git, commit);
				System.out.println(commit.toObjectId());
				// Interleave the next commit's checkout and parsing with the data processing of this commit.
				List<DataNode> nodes = parse(dataDir);
				if(dataTask != null) {
					dataTask.get();
				}
				dataTask = CompletableFuture.runAsync(() -> output.addNewData(nodes, commitInfo.get(commit)));
			}
			if(dataTask != null) {
				dataTask.get();
			}
		} catch(Exception e) {
			throw new RuntimeException(e);
		}
		output.save(new File(config.repository.getParent(), "es-wiki-diff"));
		Instant end = Instant.now();
		System.out.println("Runtime: " + (end.toEpochMilli() - start.toEpochMilli()) / 1000.0f + "s");
	}

	private static void checkout(@NotNull Git git, @NotNull RevCommit commit) throws GitAPIException {
		git.reset().setRef(ObjectId.toString(commit.toObjectId())).setMode(ResetType.HARD).call();
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

	private static @NotNull List<@NotNull DataNode> parse(@NotNull File baseDir) throws IOException, InterruptedException, ExecutionException {
		ExecutorService virtualPool = Executors.newVirtualThreadPerTaskExecutor();
		Future<List<DataNode>> result = virtualPool.submit(() -> {
			try(Stream<Path> paths = Files.walk(baseDir.toPath())) {
				return paths.parallel()
				            .filter(p -> p.toFile().isFile())
				            .mapMulti((Path path, Consumer<DataNode> mapper) -> {
					            try {
						            ListIterator<String> textIt = Files.readAllLines(path, StandardCharsets.ISO_8859_1).listIterator();
						            String filename = baseDir.toPath().relativize(path).toString();
						            while(textIt.hasNext()) {
							            int lineNumber = textIt.nextIndex() + 1;
							            DataNode node = new DataNode(textIt);
							            node.setFilePos(filename, lineNumber);
							            mapper.accept(node);
						            }
					            } catch(IOException e) {
						            throw new RuntimeException(e);
					            }
				            })
				            .filter(node -> !node.isEmpty())
				            .toList();
			}
		});
		virtualPool.shutdown();
		return result.get();
	}

	private static final class Config {
		public final File repository;

		public Config(String[] args) {
			if(args.length < 1)
				throw new IllegalArgumentException("Usage: <repository>");

			repository = new File(args[0]);
		}
	}
}
