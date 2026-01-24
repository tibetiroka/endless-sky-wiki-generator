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

import org.jetbrains.annotations.NotNull;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

public final class Tokenizer {
	private static final Map<String, Tokenizer> TOKENIZER_CACHE = new ConcurrentHashMap<>();
	private static final Pattern WHITESPACE_SEQUENCE = Pattern.compile("\\s+");
	private final @NotNull IndentLevel indent;
	private final @NotNull List<@NotNull String> tokens = new ArrayList<>();

	private Tokenizer(@NotNull String textLine) {
		String stripped = textLine.stripLeading();
		String indent = textLine.substring(0, textLine.length() - stripped.length());
		this.indent = new IndentLevel(indent);

		Iterator<String> wordIt = Arrays.stream(WHITESPACE_SEQUENCE.splitWithDelimiters(stripped, 0)).iterator();
		// build the tokens
		wordLoop:
		while(wordIt.hasNext()) {
			String word = wordIt.next();
			if(word.isBlank())
				continue;
			switch(word.charAt(0)) {
				case '#': // ignore everything after line comment
					break wordLoop;
				case '`', '"': // find matching quote at the end of a token
					StringBuilder manyWords = new StringBuilder(word);
					while(wordIt.hasNext() && (manyWords.length() < 2 || manyWords.charAt(manyWords.length() - 1) != manyWords.charAt(0))) {
						manyWords.append(wordIt.next());
					}
					tokens.add(manyWords.substring(1, manyWords.length() - 1));
					break;
				default:
					tokens.add(word);
					break;
			}
		}
	}

	/**
	 * Encases a token in the least amount of quotes required.
	 *
	 * @param token
	 * @return
	 */
	public static @NotNull String tokenToString(@NotNull String token) {
		if(token.contains(" ")) {
			if(token.contains("\"")) {
				return '`' + token + '`';
			}
			return '"' + token + '"';
		} else if(token.contains("\""))
			return '`' + token + '`';
		else if(token.contains("`"))
			return '"' + token + '"';
		return token;
	}

	public static @NotNull Tokenizer tokenize(@NotNull String textLine) {
		Tokenizer cached = TOKENIZER_CACHE.get(textLine);
		if(cached == null) {
			cached = new Tokenizer(textLine);
			TOKENIZER_CACHE.put(textLine, cached);
		}
		return cached;
	}

	public @NotNull IndentLevel getIndent() {
		return indent;
	}

	public @NotNull List<@NotNull String> getTokens() {
		return Collections.unmodifiableList(tokens);
	}

	/**
	 * Indent level for node depth comparison. Supports tabs and spaces, but not when mixed in the same indent.
	 */
	public static class IndentLevel implements Comparable<IndentLevel> {
		private final int count;
		private final boolean isTab;

		public IndentLevel(@NotNull String indent) {
			if(indent.isEmpty()) {
				isTab = true;
				count = 0;
			} else {
				isTab = indent.charAt(0) == '\t';
				count = indent.length();
			}
		}

		@Override
		public int compareTo(@NotNull Tokenizer.IndentLevel o) {
			if(o.isTab == isTab) return Integer.compare(count, o.count);
			else return isTab ? Integer.compare(count * 4, o.count) : Integer.compare(count, o.count * 4);
		}

		@Override
		public int hashCode() {
			return Objects.hash(count, isTab);
		}

		@Override
		public boolean equals(Object o) {
			if(o == null || getClass() != o.getClass()) return false;
			IndentLevel that = (IndentLevel) o;
			return count == that.count && isTab == that.isTab;
		}

		@Override
		public String toString() {
			return "IndentLevel{" +
			       "count=" + count +
			       ", isTab=" + isTab +
			       '}';
		}
	}
}
