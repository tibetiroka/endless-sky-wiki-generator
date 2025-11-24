package com.tibetiroka.endless_sky_wiki_data_resolver;

import com.google.gson.FormattingStyle;
import com.google.gson.GsonBuilder;
import org.jetbrains.annotations.Nullable;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Map;

public class Data {
	public Map<String, Object> data;
	public String filename;
	public String lastCommit;
	public int line;
	public boolean resolved = false;
	public Map<String, Object> removed;

	public void toJson(File file) throws IOException {
		try(BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
			new GsonBuilder().setFormattingStyle(FormattingStyle.PRETTY)
			                 .create()
			                 .toJson(this, writer);
		}
	}

	public @Nullable String base() {
		return (String) data.get("base");
	}

	public String name() {
		return (String) data.get("name");
	}

	@Override
	public String toString() {
		return "Data{" +
		       "data=" + data +
		       ", filename='" + filename + '\'' +
		       ", lastCommit='" + lastCommit + '\'' +
		       ", line=" + line +
		       ", resolved=" + resolved +
		       ", removed=" + removed +
		       '}';
	}
}
