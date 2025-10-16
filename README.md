# Endless Sky Wiki Generator

## Indexer

> [!NOTE]
> Each tool has its own branch. The default (master) branch is used to house shared documentation.

This tool parses the auto-generated and hand-crafted wiki files, and indexes them for searching. The generated index files are used for client-side search functionality.

This tool is written in Java. The provided maven configuration can be used to compile it into a native executable for your system, if needed:
```bash
mvn -P native package
```

To get started with the tool, specify the location of the auto-generated wiki files, and an output directory:
```bash
endless-sky-wiki-indexer <wiki-generated-dir> <index-output-dir>
```


You can find additional options with the help command:
```bash
endless-sky-wiki-indexer --help
```
