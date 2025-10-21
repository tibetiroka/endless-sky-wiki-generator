# Endless Sky Wiki Generator

## Indexer

> [!NOTE]
> Each tool has its own branch. The default (master) branch is used to house the wiki and shared documentation.

This tool parses the auto-generated wiki files, and indexes them for searching. The generated index files are used for client-side search functionality, and for displaying 

This tool is written in Java. You can package it with Maven, if you aren't using an IDE:
```bash
mvn -P portable package
```

To get started with the tool, specify the location of the auto-generated wiki files, and an output directory:
```bash
java -jar target/endless-sky-wiki-indexer.jar <wiki-generated-dir> <index-output-dir>
```
