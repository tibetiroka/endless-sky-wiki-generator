# Endless Sky Wiki Generator

## Animation creator

> [!NOTE]
> Each tool has its own branch. The default (master) branch is used to house the wiki and shared documentation.

This tool parses the auto-generated wiki files and the game's images, and creates animations from them that are used to display sprites and overhead views on the wiki.

This tool is written in Python. You can package it with Maven, if you aren't using an IDE:
```bash
mvn -P portable package
```

You will need `ffmpeg` installed on your system to create the animations.

To get started with the tool, specify the location of the auto-generated wiki files, and an output directory:
```bash
java -jar target/endless-sky-wiki-animation-creator.jar <wiki-generated-dir> <repository-dir> <output-dir>
```
