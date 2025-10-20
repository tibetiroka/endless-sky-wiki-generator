# Endless Sky Wiki Generator

## Changelog generator

> [!NOTE]
> Each tool has its own branch. The default (master) branch is used to house shared documentation.

This tool parses the entire git history of `endless-sky/endless-sky`, and:
- parses the game's data files,
- finds the data changes made in each commit using a specialized diffing tool,
- generates detailed changelogs with information about the commit, committer, and game release version, and
- stores the latest state of each ship/outfit/etc., even if they were removed from the game.

This tool is written in Java. To run the tool, you only need to specify a directory to clone the game into:
```bash
mvn -P portable package
java -jar target/endless-sky-changelog-generator.jar <directory> 
```

If you want to use this tool for development, it is recommended to use a directory mounted in memory, such as `/tmp` on most linux distributions:
```bash
java -jar target/endless-sky-changelog-generator.jar /tmp/endless-sky
```

The tool with clone the repository for you, or update it if it's already present. The generated JSON files are placed in the `es-wiki-diff` directory next to it.
