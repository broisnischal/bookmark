import * as vscode from "vscode";

class BookmarkItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly uri: vscode.Uri,
  ) {
    super(label, collapsibleState);
  }
}

export class BookmarkProvider implements vscode.TreeDataProvider<BookmarkItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    BookmarkItem | undefined | null | void
  > = new vscode.EventEmitter<BookmarkItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    BookmarkItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  getTreeItem(element: BookmarkItem): vscode.TreeItem {
    return element;
  }

  removeBookmark(uri: vscode.Uri): void {
    // Handle removing the bookmark
    vscode.window.showInformationMessage(`Removed bookmark for ${uri.fsPath}`);
    this._onDidChangeTreeData.fire();
  }

  getChildren(element?: BookmarkItem): Thenable<BookmarkItem[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders) {
        return Promise.all(
          workspaceFolders.map((folder) => {
            return vscode.workspace.fs
              .readDirectory(folder.uri)
              .then((entries) => {
                return entries.map(([name, type]) => {
                  const uri = vscode.Uri.joinPath(folder.uri, name);
                  const collapsibleState =
                    type === vscode.FileType.Directory
                      ? vscode.TreeItemCollapsibleState.Collapsed
                      : vscode.TreeItemCollapsibleState.None;
                  const item = new BookmarkItem(name, collapsibleState, uri);
                  item.command = {
                    command: "bookmark.openFile",
                    title: "Open File",
                    arguments: [uri],
                  };
                  return item;
                });
              });
          }),
        ).then((items) => [].concat(...items));
      }
      return Promise.resolve([]);
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  openFile(uri: vscode.Uri): void {
    vscode.window.showTextDocument(uri);
  }
}
