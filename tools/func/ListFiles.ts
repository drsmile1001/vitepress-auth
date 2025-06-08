import { write } from "bun";

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

import kleur from "kleur";

export async function listFiles(options: {
  rootDir: string;
  extensions: string[];
  excludeDirs: string[];
  flat?: boolean;
  outputPath?: string;
}) {
  const {
    rootDir,
    extensions,
    excludeDirs,
    flat = false,
    outputPath = "dist/ts-files.txt",
  } = options;

  type TreeNode = {
    name: string;
    children?: TreeNode[];
    fullPath: string;
    isFile: boolean;
  };

  async function walk(dir: string): Promise<TreeNode[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const nodes: TreeNode[] = [];

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (excludeDirs.includes(entry.name)) continue;

      const fullPath = join(dir, entry.name);
      const relPath = relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        const children = await walk(fullPath);
        nodes.push({
          name: entry.name,
          children,
          fullPath: relPath,
          isFile: false,
        });
      } else if (
        !extensions.length ||
        extensions.some((ext) => entry.name.endsWith(`.${ext}`))
      ) {
        nodes.push({ name: entry.name, fullPath: relPath, isFile: true });
      }
    }

    return nodes;
  }

  function renderTree(nodes: TreeNode[], prefix = ""): string[] {
    const lines: string[] = [];

    nodes.forEach((node, idx) => {
      const last = idx === nodes.length - 1;
      const branch = last ? "└─" : "├─";
      const icon = node.isFile ? "📄" : "📁";
      lines.push(`${prefix}${branch}${icon} ${node.name}`);
      if (node.children) {
        const nextPrefix = prefix + (last ? "  " : "│ ");
        lines.push(...renderTree(node.children, nextPrefix));
      }
    });

    return lines;
  }

  function printTree(nodes: TreeNode[], prefix = ""): void {
    nodes.forEach((node, idx) => {
      const last = idx === nodes.length - 1;
      const branch = last ? "└─" : "├─";
      const icon = node.isFile ? "📄" : "📁";
      console.log(`${prefix}${branch}${icon} ${kleur.cyan(node.name)}`);
      if (node.children) {
        const nextPrefix = prefix + (last ? "  " : "│ ");
        printTree(node.children, nextPrefix);
      }
    });
  }

  function flattenTree(nodes: TreeNode[]): string[] {
    const list: string[] = [];
    for (const node of nodes) {
      if (node.isFile) list.push(node.fullPath);
      if (node.children) list.push(...flattenTree(node.children));
    }
    return list;
  }

  const tree = await walk(rootDir);
  const allFiles = flattenTree(tree);
  console.log(kleur.green(`📦 檔案列表如下：\n`));
  if (flat) {
    for (const file of allFiles) {
      console.log(" -", kleur.cyan(file));
    }
    await write(outputPath, allFiles.join("\n"));
  } else {
    console.log(kleur.green(`📦`));
    printTree(tree);
    const treeLines = renderTree(tree);
    const fileLines = [
      `📦`,
      ...treeLines, // Include the tree structure
    ];
    await write(outputPath, fileLines.join("\n"));
  }
  console.log(kleur.green(`\n📦 找到 ${allFiles.length} 個檔案`));
  console.log(kleur.green(`📦 檔案列表已寫入 ${kleur.cyan(outputPath)}`));
}
