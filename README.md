# Endless Sky Wiki

## Data resolver

> [!NOTE]
> Each tool has its own branch. The default (master) branch is used to house the wiki and shared documentation.

This tool parses the auto-generated wiki data, and resolves dependencies by pulling in the necessary attributes. For instance, ships with a base model might not define their sprites, so this tool pulls that in from their parent.

This tool is written in Java. You can package it with Maven, if you aren't using an IDE:
```bash
mvn -P portable package
```

To get started with the tool, specify the location of the auto-generated wiki files. They will get resolved in-place.
```bash
java -jar target/endless-sky-wiki-data-resolver.jar <wiki-generated-dir>
```
