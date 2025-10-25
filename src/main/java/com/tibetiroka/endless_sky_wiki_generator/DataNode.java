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
import org.jetbrains.annotations.Nullable;
import com.tibetiroka.endless_sky_wiki_generator.Tokenizer.IndentLevel;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public final class DataNode implements Comparable<DataNode> {
	private static final Map<DataNode, String> DATA_STRINGS = new ConcurrentHashMap<>();
	private final @NotNull List<@NotNull DataNode> children = new ArrayList<>();
	private final @NotNull IndentLevel indent;
	// The key is the ES node "key". This is the type of the node, except for some special cases.
	private final @Nullable String key;
	// The values of the node following the key
	private final @NotNull List<@NotNull String> values = new ArrayList<>();
	private @Nullable String fileName;
	private int lineNumber;
	private int cachedHashCode = 0;

	public DataNode(@NotNull ListIterator<@NotNull String> lines) {
		if(!lines.hasNext()) {
			throw new IllegalArgumentException("Empty iterator!");
		}
		Tokenizer tokenizer = Tokenizer.tokenize(lines.next());
		indent = tokenizer.getIndent();
		String key = null;
		Iterator<String> tokens = tokenizer.getTokens().iterator();
		if(tokens.hasNext()) {
			key = tokens.next();
			if((key.equals("to") || key.equals("on")) && tokens.hasNext()) {
				key += " " + tokens.next();
			}
		}
		while(tokens.hasNext()) values.add(tokens.next());
		this.key = key;

		// parse the children until we find a node with non-greater indentation
		while(lines.hasNext()) {
			String next = lines.next();
			if(next.isBlank())
				continue;
			tokenizer = Tokenizer.tokenize(next);
			if(!tokenizer.getTokens().isEmpty()) {
				if(tokenizer.getIndent().compareTo(indent) <= 0) {
					lines.previous();
					break;
				} else {
					lines.previous();
					children.add(new DataNode(lines));
				}
			}
		}
		children.removeIf(DataNode::isEmpty);
		if(!isOrderedNode())
			children.sort(Comparator.naturalOrder());
	}

	@Override
	public int compareTo(@NotNull DataNode o) {
		// There are versions with broken indentation, so we can't do this check here.
		// This only triggers if the data is wrong or the node parser is broken.
		/*if(indent.compareTo(o.indent) != 0)
			throw new IllegalArgumentException("Data nodes must have the same indent level when sorting");*/

		// ordered nodes (such as description) shouldn't be changed around
		if(isOrderedNode() && Objects.equals(key, o.key))
			return 0;

		// lexical ordering for all fields and children
		if((key == null) != (o.key == null)) return key == null ? -1 : 1;
		else if(key != null && !key.equals(o.key)) return key.compareTo(o.key);

		if(!values.equals(o.values)) {
			int sizeCmp = Integer.compare(values.size(), o.values.size());
			if(sizeCmp != 0) return sizeCmp;
			Iterator<String> myIt = values.iterator(), otherIt = o.values.iterator();
			while(myIt.hasNext()) {
				int vCmp = myIt.next().compareTo(otherIt.next());
				if(vCmp != 0) return vCmp;
			}
		}
		int sizeCmp = Integer.compare(children.size(), o.children.size());
		if(sizeCmp != 0) return sizeCmp;
		Iterator<DataNode> myIt = children.iterator(), otherIt = o.children.iterator();
		for(int i = 0; i < children.size(); ++i) {
			int vCmp = myIt.next().compareTo(otherIt.next());
			if(vCmp != 0) return vCmp;
		}

		return 0;
	}

	public @NotNull Collection<@NotNull DataNode> getChildren() {
		return Collections.unmodifiableCollection(children);
	}

	public @Nullable String getFileName() {
		return fileName;
	}

	public @NotNull IndentLevel getIndent() {
		return indent;
	}

	public @Nullable String getKey() {
		return key;
	}

	public int getLineNumber() {
		return lineNumber;
	}

	public @Nullable String getName() {
		if(key == null || values.isEmpty())
			return null;
		return values.getLast();
	}

	public @NotNull List<@NotNull String> getValues() {
		return Collections.unmodifiableList(values);
	}

	public boolean isOrderedNode() {
		if(key == null)
			return false;
		return switch(key) {
			case "conversation", "dialog", "description", "category" -> true;
			default -> false;
		};
	}

	public void setFilePos(@NotNull String fileName, int lineNumber) {
		this.fileName = fileName;
		this.lineNumber = lineNumber;
	}

	@Override
	public String toString() {
		String cached = DATA_STRINGS.get(this);
		if(cached == null) {
			StringBuilder sb = new StringBuilder();
			if(key != null) {
				if(key.startsWith("to ") && !children.isEmpty())
					sb.append(key);
				else
					sb.append(Tokenizer.tokenToString(key));
			}
			for(String value : values) {
				sb.append(' ').append(Tokenizer.tokenToString(value));
			}
			for(DataNode child : children) {
				sb.append('\n');
				sb.append(child.toString().indent(4).stripTrailing());
			}
			cached = sb.toString().strip();
			DATA_STRINGS.put(this, cached);
		}
		return cached;
	}

	@Override
	public boolean equals(Object o) {
		if(o == null || getClass() != o.getClass()) return false;
		DataNode dataNode = (DataNode) o;
		return lineNumber == dataNode.lineNumber && Objects.equals(children, dataNode.children) && Objects.equals(indent, dataNode.indent) && Objects.equals(key, dataNode.key) && Objects.equals(values, dataNode.values) && Objects.equals(fileName, dataNode.fileName);
	}

	@Override
	public int hashCode() {
		if(cachedHashCode == 0) {
			cachedHashCode = Objects.hash(children, indent, key, values, fileName, lineNumber);
		}
		return cachedHashCode;
	}

	boolean isEmpty() {
		return key == null && children.isEmpty() && values.isEmpty();
	}
}
