// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { BookmarkProvider } from "./tree_view";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const bookmarkProvider = new BookmarkProvider();

  vscode.window.registerTreeDataProvider("favourites", bookmarkProvider);

  let disposable = vscode.commands.registerCommand(
    "bookmark.addBookmark",
    async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders) {
        vscode.window.showErrorMessage("No workspace folders");
        return;
      }

      const items = await Promise.all(
        folders.flatMap(async (folder: vscode.WorkspaceFolder) => {
          const entries = await vscode.workspace.fs.readDirectory(folder.uri);
          return entries.map(([name, type]) => ({
            label: name,
            description: folder.name,
            uri: vscode.Uri.joinPath(folder.uri, name),
            type,
          }));
        }),
      );

      const pickedItems = await vscode.window.showQuickPick(items.flat(), {
        canPickMany: true,
        placeHolder: "Select files to bookmark",
      });

      if (pickedItems) {
        const pickedPaths = pickedItems.map((item) => item.uri.fsPath);
        // Store pickedPaths in workspaceState
        context.workspaceState.update("bookmarks", pickedPaths);
        vscode.window.showInformationMessage(
          `Added ${pickedPaths.length} items to bookmarks.`,
        );
      }
    },
  );

  let disposable1 = vscode.commands.registerCommand(
    "bookmark.favourites",
    async () => {
      const storedBookmarks =
        context.workspaceState.get<string[]>("bookmarks") || [];

      const bookmarkItems = storedBookmarks.map((path) => {
        const uri = vscode.Uri.file(path);

        if (uri) {
          bookmarkProvider.openFile(uri);
        }

        const label = vscode.workspace.asRelativePath(uri);
        return {
          label,
          description: uri.fsPath,
          uri,
          type: vscode.FileType.File,
        };
      });

      const pickedItems = await vscode.window.showQuickPick(bookmarkItems, {
        canPickMany: true,
        placeHolder: "Select files to open",
      });

      if (pickedItems) {
        pickedItems.forEach((item) => {
          vscode.window.showTextDocument(item.uri);
        });
      }
    },
  );

  let removeDisposable = vscode.commands.registerCommand(
    "bookmark.removeBookmark",
    async (uri: vscode.Uri) => {
      const storedBookmarks =
        context.workspaceState.get<string[]>("bookmarks") || [];
      const updatedBookmarks = storedBookmarks.filter(
        (path) => path !== uri.fsPath,
      );
      await context.workspaceState.update("bookmarks", updatedBookmarks);
      bookmarkProvider.refresh(); // Update tree view
    },
  );

  let openfile = vscode.commands.registerCommand(
    "bookmark.openFile",
    async (uri: vscode.Uri) => {
      if (uri) {
        bookmarkProvider.openFile(uri);
      }
    },
  );

  context.subscriptions.push(openfile);
  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable1);
  context.subscriptions.push(removeDisposable);
}
