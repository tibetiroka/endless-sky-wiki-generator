# Endless Sky Wiki Generator

This repository houses various automation tools and data used with the community-made Endless Sky wiki. If you are looking for the wiki repository, visit TODO instead.
> [!NOTE]
> Each tool has its own branch. The default (master) branch is used to house shared documentation.

- `changelog-generator`: Git-based changelog generator and Endless Sky data parser.
  - This tool parses the entire commit history of the game, parses the data files, and generates JSON files from them.
  - You can use the output to access the latest version of any ship, outfit etc. data, or to view changes made in a specific release.
  - This tool is used to automatically generate the vast majority of the wiki contents and keep the stats up to date.
- `indexer`: Indexes the contents of the wiki for client-side search.
  - This is what enables the search bar to function without any server-side queries.
- `packager`: Runs the above tools and packages the results to web-friendly formats.
  - The raw JSON files are compressed with gzip (which is supported by the JS compression streams API).
  - Data files belonging to the same wiki entry are tarballed together so the client only downloads a single file.

For more details on these tools, visit each of the branches. There is also a `dev-data` branch with an example data deployment.
