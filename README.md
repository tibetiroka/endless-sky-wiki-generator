# Endless Sky Wiki

This repository houses the semi-official Endless Sky wiki, alongside various tools and data used to make it happen. This branch of the repository houses the wiki pages; for most people, this is what you are looking for.
> [!NOTE]
> Each tool has its own branch. The default (master) branch is used to house the wiki and shared documentation.

- `changelog-generator`: Git-based changelog generator and Endless Sky data parser.
  - This tool parses the entire commit history of the game, parses the data files, and generates JSON files from them.
  - You can use the output to access the latest version of any ship, outfit etc. data, or to view changes made in a specific release.
  - This tool is used to automatically generate the vast majority of the wiki contents and keep the stats up to date.
- `indexer`: Indexes the contents of the wiki for client-side search.
  - This is what enables the search bar to function without any server-side queries.
- `packager`: Runs the above tools and packages the results to web-friendly formats.
  - The raw JSON files are compressed with gzip (which is supported by the JS compression streams API).
  - Some data files are tarballed together so the client doesn't have to download that many files.
- `deploy`: The current state of the wiki, with all the data and web pages generated.

For more details on these tools, visit each of the branches.
