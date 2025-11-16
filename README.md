# Endless Sky Wiki Generator

## Packager

> [!NOTE]
> Each tool has its own branch. The default (master) branch is used to house the wiki and shared documentation.

This tool packages the auto-generated files into web-friendly formats. This generates the final data files that your browser uses when visiting the wiki.

This tool is written in Bash. You may need to install additional tools; the script will warn you if something is missing.

To get started with the tool, specify the location of the auto-generated wiki files, the hand-made wiki files, and an output directory:
```bash
./endless-sky-wiki-packager.sh <wiki-generated-dir> <index-dir> <assets-dir> <output-dir>
```

You can also use `/dev/null` as an input if you want to skip it.