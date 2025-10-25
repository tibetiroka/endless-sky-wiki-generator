# Endless Sky Wiki Generator

## Changelog generator

> [!NOTE]
> Each tool has its own branch. The default (master) branch is used to house shared documentation.

This tool parses the entire git history of `endless-sky/endless-sky`, and:
- parses the game's data files,
- finds the data changes made in each commit using a specialized diffing tool,
- generates detailed changelogs with information about the commit, committer, and game release version, and
- stores the latest state of each ship/outfit/etc., even if they were removed from the game.

This tool is written in Java. To run the tool, run the following commands (if you don't have an IDE):
```bash
mvn -P portable package
java -jar -XX:+UseStringDeduplication target/endless-sky-changelog-generator.jar
```

This tool will clone the game's repository into  a temporary directory (`/tmp` on linux), and crunch through several thousand commits. It is highly recommended to run this tool on linux, as the temporary directory keeps the files in memory, which is massively faster than writing them to a disk.

The generated JSON files are placed in the `es-wiki-diff` directory next to the game's repository.
