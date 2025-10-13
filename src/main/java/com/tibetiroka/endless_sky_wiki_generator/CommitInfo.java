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

import com.google.gson.JsonObject;
import org.eclipse.jgit.lib.PersonIdent;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.revwalk.RevCommit;
import org.jetbrains.annotations.NotNull;

import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.Map.Entry;

public final class CommitInfo {
	private final String author;
	private final String hash;
	private final String message;
	private final String parent;
	private final String tag;
	private final Instant time;

	public CommitInfo(@NotNull RevCommit commit, @NotNull Map<@NotNull Ref, Integer> tags) {
		PersonIdent ident = commit.getAuthorIdent();
		author = ident.getName();
		hash = commit.getName();
		message = commit.getShortMessage();
		time = ident.getWhenAsInstant();
		parent = commit.getParentCount() == 0 ? null : commit.getParent(0).getName();
		int commitTime = commit.getCommitTime();
		tag = tags.entrySet()
		          .stream()
		          .filter(e -> e.getValue() >= commitTime)
		          .min(Comparator.comparingInt(Entry::getValue)).get().getKey().getName();
	}

	public @NotNull String getParent() {
		return parent;
	}

	public @NotNull JsonObject toJson() {
		JsonObject data = new JsonObject();
		data.addProperty("author", author);
		data.addProperty("hash", hash);
		data.addProperty("message", message);
		data.addProperty("tag", tag.substring(tag.lastIndexOf('/') + 1));
		data.addProperty("time", time.toEpochMilli());

		return data;
	}
}