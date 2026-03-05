import React from "react";

type MarkdownGuideBoxProps = {};

const MarkdownGuideBox: React.FC<MarkdownGuideBoxProps> = () => {
  return (
    <div className="max-h-[75vh] overflow-y-auto px-8 py-6 scrollbar-transparent">
      {/* Main Title */}
      <h1 className="text-4xl font-bold mb-4">
        Markdown Editor Toolbar – Complete Usage Guide
      </h1>

      <p className="text-muted-foreground mb-6 leading-relaxed text-base">
        This editor uses <strong>Markdown</strong>, a lightweight syntax for
        formatting text. The toolbar provides quick shortcuts to insert common
        Markdown patterns without memorizing syntax.
      </p>

      <p className="text-muted-foreground mb-4 leading-relaxed text-base">
        Below is a <strong>detailed explanation of every button</strong>, what
        it does, and how to use it effectively.
      </p>

      <div className="bg-secondary/50 border border-border rounded-md px-5 py-4 mb-10">
        <p className="text-sm font-semibold mb-2">💡 Pro tip</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The <strong>live preview panel</strong> on the right updates in real
          time as you type — you always see exactly how your post will look
          before publishing. No need to guess!
        </p>
      </div>

      <hr className="my-8 border-border" />

      {/* Text Formatting Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">✍️</span> Text Formatting
        </h2>

        <p className="text-muted-foreground mb-6 text-base leading-relaxed">
          <strong>Tip:</strong> For all formatting buttons — you can either{" "}
          <strong>select text first then click the button</strong> (wraps your
          selection), or <strong>click the button first then type</strong>{" "}
          between the inserted markers.
        </p>

        {/* Bold */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">
            Bold (
            <code className="text-sm bg-secondary px-3 py-1.5 rounded">B</code>)
          </h3>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Makes text bold.
          </p>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Markdown syntax:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>**bold text**</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <p className="text-base">
              <strong>bold text</strong>
            </p>
          </div>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Example:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>This is **important** information.</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <p className="text-base">
              This is <strong>important</strong> information.
            </p>
          </div>
        </div>

        {/* Italic */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">
            Italic (
            <code className="text-sm bg-secondary px-3 py-1.5 rounded">I</code>)
          </h3>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Italicizes text.
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>*italic text*</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <p className="text-base">
              <em>italic text</em>
            </p>
          </div>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Example:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>This is *emphasized* text.</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <p className="text-base">
              This is <em>emphasized</em> text.
            </p>
          </div>
        </div>

        {/* Strikethrough */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Strikethrough</h3>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Draws a line through text. Useful for
            showing a wrong approach, a rejected idea, or something that no
            longer applies.
          </p>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Markdown syntax:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>~~strikethrough text~~</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <p className="text-base">
              <s>strikethrough text</s>
            </p>
          </div>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Example:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>
              ~~O(n²) brute force~~ → optimized to O(n) with a hash map.
            </code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <p className="text-base">
              <s>O(n²) brute force</s> → optimized to O(n) with a hash map.
            </p>
          </div>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Headings Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">🏷️</span> Headings
        </h2>
        <p className="text-muted-foreground mb-6 text-base leading-relaxed">
          Headings help structure your post and improve readability. Use them to
          separate sections like Intuition, Approach, and Complexity.
        </p>
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Heading 1 (H1)</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code># Heading 1</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-3">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <h1 className="text-3xl font-bold">Heading 1</h1>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Use for main titles or top-level section names.
          </p>
        </div>
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Heading 2 (H2)</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>## Heading 2</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-3">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <h2 className="text-2xl font-semibold">Heading 2</h2>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Use for subsections within a main section.
          </p>
        </div>
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Heading 3 (H3)</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>### Heading 3</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-3">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <h3 className="text-xl font-semibold">Heading 3</h3>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Use for deeper breakdowns or nested topics.
          </p>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Lists Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">📋</span> Lists
        </h2>

        {/* Bullet List */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Bullet List</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`* Item one\n* Item two\n* Item three`}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-1">
              <li>Item one</li>
              <li>Item two</li>
              <li>Item three</li>
            </ul>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>Tip:</strong> Press <strong>Enter</strong> at the end of a
            bullet line and the editor automatically adds the next{" "}
            <code className="text-sm bg-secondary px-2 py-1 rounded">* </code>{" "}
            for you.
          </p>
        </div>

        {/* Numbered List */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Numbered List</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`1. First step\n2. Second step\n3. Third step`}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <ol className="list-decimal list-outside ml-5 space-y-1">
              <li>First step</li>
              <li>Second step</li>
              <li>Third step</li>
            </ol>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>Tip:</strong> Press <strong>Enter</strong> and the editor
            automatically increments the number for the next item.
          </p>
        </div>

        {/* Nested Lists */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Nested Lists</h3>

          <p className="text-muted-foreground mb-5 text-base leading-relaxed">
            You can nest any list inside any other list — bullet inside
            numbered, numbered inside bullet, or the same type inside itself.
            The only rule is indentation:{" "}
            <strong>indent child items by 2 spaces</strong> relative to their
            parent. Each additional level of nesting needs 2 more spaces.
          </p>

          {/* How to create a nested item step by step */}
          <div className="mb-8">
            <h4 className="text-xl font-semibold mb-3">
              How to create a nested item
            </h4>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              Follow these steps to nest a list item:
            </p>
            <ol className="list-decimal list-outside ml-6 text-muted-foreground space-y-2 text-base leading-relaxed mb-4">
              <li>
                Write a top-level list item, e.g.{" "}
                <code className="text-sm bg-secondary px-2 py-1 rounded">
                  * Parent item
                </code>
              </li>
              <li>
                Press <strong>Enter</strong> — the editor auto-continues with{" "}
                <code className="text-sm bg-secondary px-2 py-1 rounded">
                  *{" "}
                </code>{" "}
                at the same level
              </li>
              <li>
                Press <strong>Tab</strong> — this indents the current line by 2
                spaces, moving it one level deeper
              </li>
              <li>
                Now type your marker —{" "}
                <code className="text-sm bg-secondary px-2 py-1 rounded">
                  *{" "}
                </code>{" "}
                for a bullet or{" "}
                <code className="text-sm bg-secondary px-2 py-1 rounded">
                  1.{" "}
                </code>{" "}
                for a number — then type your content
              </li>
              <li>
                Press <strong>Enter</strong> again — the editor auto-continues
                at the same nested level with the same marker type you used
              </li>
            </ol>
            <div className="bg-secondary/50 border border-border rounded-md px-5 py-4 mb-2">
              <p className="text-sm font-semibold mb-2">
                Example flow in the editor:
              </p>
              <pre className="font-mono text-sm text-muted-foreground leading-6">{`* Parent item        ← type this, press Enter
* |                  ← auto-continued, press Tab
  |                  ← indented, now type * and space
  * |                ← type your child content, press Enter
  * |                ← auto-continued at same nested level`}</pre>
            </div>
          </div>

          {/* Bullet inside bullet */}
          <div className="mb-8">
            <h4 className="text-xl font-semibold mb-3">Bullet inside bullet</h4>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{`* Algorithms\n  * Sorting\n    * Merge Sort\n    * Quick Sort\n  * Searching\n    * Binary Search\n* Data Structures`}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-2">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <ul className="list-disc list-outside ml-5 space-y-1">
                <li>
                  Algorithms
                  <ul className="list-disc list-outside ml-5 mt-1 space-y-1">
                    <li>
                      Sorting
                      <ul className="list-disc list-outside ml-5 mt-1 space-y-1">
                        <li>Merge Sort</li>
                        <li>Quick Sort</li>
                      </ul>
                    </li>
                    <li>
                      Searching
                      <ul className="list-disc list-outside ml-5 mt-1 space-y-1">
                        <li>Binary Search</li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>Data Structures</li>
              </ul>
            </div>
          </div>

          {/* Numbered inside numbered */}
          <div className="mb-8">
            <h4 className="text-xl font-semibold mb-3">
              Numbered inside numbered
            </h4>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{`1. Initialize pointers\n  1. Set left = 0\n  2. Set right = n - 1\n2. Run the loop`}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-2">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <ol className="list-decimal list-outside ml-5 space-y-1">
                <li>
                  Initialize pointers
                  <ol className="list-decimal list-outside ml-5 mt-1 space-y-1">
                    <li>Set left = 0</li>
                    <li>Set right = n - 1</li>
                  </ol>
                </li>
                <li>Run the loop</li>
              </ol>
            </div>
          </div>

          {/* Bullet inside numbered */}
          <div className="mb-8">
            <h4 className="text-xl font-semibold mb-3">
              Bullet inside numbered
            </h4>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              Start a numbered list, press Enter, press Tab, then type{" "}
              <code className="text-sm bg-secondary px-2 py-1 rounded">* </code>{" "}
              to start a bullet child.
            </p>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{`1. Choose an approach\n  * Hash map for O(n) time\n  * Two pointers for O(1) space\n2. Implement it`}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-2">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <ol className="list-decimal list-outside ml-5 space-y-1">
                <li>
                  Choose an approach
                  <ul className="list-disc list-outside ml-5 mt-1 space-y-1">
                    <li>Hash map for O(n) time</li>
                    <li>Two pointers for O(1) space</li>
                  </ul>
                </li>
                <li>Implement it</li>
              </ol>
            </div>
          </div>

          {/* Numbered inside bullet */}
          <div className="mb-8">
            <h4 className="text-xl font-semibold mb-3">
              Numbered inside bullet
            </h4>
            <p className="text-muted-foreground mb-3 text-base leading-relaxed">
              Start a bullet list, press Enter, press Tab, then type{" "}
              <code className="text-sm bg-secondary px-2 py-1 rounded">
                1.{" "}
              </code>{" "}
              to start a numbered child.
            </p>
            <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
              <code>{`* Two pointer approach\n  1. Set left = 0, right = n - 1\n  2. Move pointers inward\n  3. Return when they meet\n* Hash map approach`}</code>
            </pre>
            <div className="bg-secondary/50 border border-border p-4 rounded-md mb-2">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Result:
              </p>
              <ul className="list-disc list-outside ml-5 space-y-1">
                <li>
                  Two pointer approach
                  <ol className="list-decimal list-outside ml-5 mt-1 space-y-1">
                    <li>Set left = 0, right = n - 1</li>
                    <li>Move pointers inward</li>
                    <li>Return when they meet</li>
                  </ol>
                </li>
                <li>Hash map approach</li>
              </ul>
            </div>
          </div>

          {/* Key rules callout */}
          <div className="bg-secondary/50 border border-border rounded-md px-5 py-4">
            <p className="text-sm font-semibold mb-3">
              📌 Key rules for nested lists
            </p>
            <ul className="list-disc list-outside ml-5 text-sm text-muted-foreground space-y-3">
              <li>
                <strong>Indent by 2 spaces</strong> to start a nested level.
                Each further level needs 2 more spaces — 4 for level 3, 6 for
                level 4, and so on.
              </li>
              <li>
                <strong>Use Tab to indent</strong> — it moves the entire current
                line 2 spaces deeper. You still choose the marker yourself by
                typing{" "}
                <code className="bg-secondary px-1.5 py-0.5 rounded">* </code>{" "}
                or{" "}
                <code className="bg-secondary px-1.5 py-0.5 rounded">1. </code>{" "}
                after indenting.
              </li>
              <li>
                <strong>Use Shift+Tab to outdent</strong> — it removes 2 leading
                spaces from the current line, moving it one level back up. Each
                press of Shift+Tab removes exactly one level, so to go from
                level 3 back to level 1 you press Shift+Tab twice.
              </li>
              <li>
                <strong>Backspace does not outdent</strong> — it only deletes
                characters normally, one at a time. If you pressed Tab to indent
                and want to undo it, use <strong>Shift+Tab</strong> instead of
                Backspace. Backspace would just delete individual spaces and
                leave the marker broken.
              </li>
              <li>
                <strong>Any combination works</strong> — bullet inside numbered,
                numbered inside bullet, or same type inside same type. The
                indentation is what controls nesting, not the list type.
              </li>
              <li>
                <strong>Enter on an empty list item exits the list</strong> — if
                you press Enter on a line that has only a marker and no text,
                the marker is removed and you get a plain new line. This is how
                you finish a list.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Code Formatting Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">💻</span> Code Formatting
        </h2>
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Inline Code</h3>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Highlights short code snippets inside
            a line of text.
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`Use the \`map()\` function.`}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <p className="text-base">
              Use the{" "}
              <code className="bg-secondary px-2 py-1 rounded text-sm">
                map()
              </code>{" "}
              function.
            </p>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Best for function names, variable names, or short expressions inside
            a sentence.
          </p>
        </div>
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Code Block</h3>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            Used for multi-line code. Add the language name after the opening
            backticks for syntax highlighting.
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`\`\`\`cpp\nint twoSum(vector<int>& nums) {\n  return 0;\n}\n\`\`\``}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <pre className="bg-card border border-border p-3 rounded text-sm overflow-x-auto">
              <code>{`int twoSum(vector<int>& nums) {\n  return 0;\n}`}</code>
            </pre>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>Tip:</strong> Your solution code is automatically inserted
            in a code block with the correct language when you open the editor —
            you don't need to add it manually.
          </p>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Table Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">📊</span> Table
        </h2>
        <p className="text-muted-foreground mb-4 text-base leading-relaxed">
          Used to display structured data in rows and columns. Great for
          comparing approaches, listing complexity trade-offs, or summarising
          results side by side.
        </p>
        <p className="text-muted-foreground mb-3 text-base leading-relaxed">
          <strong>Markdown syntax:</strong>
        </p>
        <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
          <code>{`| Approach       | Time   | Space  |\n| -------------- | ------ | ------ |\n| Brute Force    | O(n²)  | O(1)   |\n| Hash Map       | O(n)   | O(n)   |`}</code>
        </pre>
        <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
          <p className="text-sm text-muted-foreground mb-3 font-semibold">
            Result:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm rounded-lg overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 border border-border font-semibold text-left">
                    Approach
                  </th>
                  <th className="px-4 py-2 border border-border font-semibold text-left">
                    Time
                  </th>
                  <th className="px-4 py-2 border border-border font-semibold text-left">
                    Space
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-border text-muted-foreground">
                    Brute Force
                  </td>
                  <td className="px-4 py-2 border border-border text-muted-foreground">
                    O(n²)
                  </td>
                  <td className="px-4 py-2 border border-border text-muted-foreground">
                    O(1)
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="px-4 py-2 border border-border text-muted-foreground">
                    Hash Map
                  </td>
                  <td className="px-4 py-2 border border-border text-muted-foreground">
                    O(n)
                  </td>
                  <td className="px-4 py-2 border border-border text-muted-foreground">
                    O(n)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-muted-foreground text-base leading-relaxed">
          <strong>Tip:</strong> Clicking the Table button inserts a ready-made
          3-column template — just replace the placeholder text with your own
          content. The{" "}
          <code className="text-sm bg-secondary px-2 py-1 rounded">
            | --- |
          </code>{" "}
          row is required and defines the column separators — don't delete it.
        </p>
      </section>

      <hr className="my-8 border-border" />

      {/* Quote Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">💬</span> Quote
        </h2>
        <p className="text-muted-foreground mb-4 text-base leading-relaxed">
          Used for notes, callouts, or highlighting an important thought that
          should stand out from the rest of the text.
        </p>
        <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
          <code>{`> This is an important note.`}</code>
        </pre>
        <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">
            Result:
          </p>
          <blockquote className="border-l-4 border-border pl-4 italic">
            This is an important note.
          </blockquote>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Horizontal Rule Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">➖</span> Horizontal Rule
        </h2>
        <p className="text-muted-foreground mb-4 text-base leading-relaxed">
          Inserts a full-width divider line. Use it to visually separate major
          sections of your post when a heading feels too heavy.
        </p>
        <p className="text-muted-foreground mb-3 text-base leading-relaxed">
          <strong>Markdown syntax:</strong>
        </p>
        <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
          <code>{`Some content above\n\n---\n\nSome content below`}</code>
        </pre>
        <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">
            Result:
          </p>
          <p className="text-base mb-3">Some content above</p>
          <hr className="border-border my-2" />
          <p className="text-base mt-3">Some content below</p>
        </div>
        <p className="text-muted-foreground text-base leading-relaxed">
          <strong>Tip:</strong> Make sure there is a blank line before and after{" "}
          <code className="text-sm bg-secondary px-2 py-1 rounded">---</code>,
          otherwise Markdown may interpret it as a heading underline instead.
        </p>
      </section>

      <hr className="my-8 border-border" />

      {/* Links & Images Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">🔗</span> Links & Images
        </h2>
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Link</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`[Link Text](https://example.com)`}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <a
              href="https://example.com"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Link Text
            </a>
          </div>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Example:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`[Official Docs](https://leetcode.com)`}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Result:
            </p>
            <a
              href="https://leetcode.com"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Official Docs
            </a>
          </div>
        </div>
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Image Upload 🖼️</h3>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Opens a file picker so you can upload
            an image directly from your device. The image is uploaded to the
            cloud and automatically inserted into your post.
          </p>
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>How to use:</strong>
          </p>
          <ol className="list-decimal list-outside ml-6 text-muted-foreground space-y-2 text-base leading-relaxed mb-4">
            <li>
              Click the <strong>Image button</strong> in the toolbar
            </li>
            <li>
              Select an image from your device (max 5MB, any common image
              format)
            </li>
            <li>
              A{" "}
              <code className="text-sm bg-secondary px-2 py-1 rounded">
                ![uploading...](placeholder)
              </code>{" "}
              tag appears in the editor while it uploads
            </li>
            <li>
              Once uploaded, it's automatically replaced with the real image
            </li>
          </ol>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              What it inserts after upload:
            </p>
            <pre className="font-mono text-sm">{`![image](https://res.cloudinary.com/...)`}</pre>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>Tip:</strong> Great for including diagrams, visualizations,
            or annotated screenshots to explain your approach.
          </p>
        </div>
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">
            Image via URL (manual)
          </h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`![Alt text](image-url)`}</code>
          </pre>
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">
              Example:
            </p>
            <pre className="font-mono text-sm">{`![Two Sum Diagram](https://example.com/twosum.png)`}</pre>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed">
            Use this if you already have an image hosted somewhere and just want
            to paste its URL directly.
          </p>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Reset Button Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">🔄</span> Reset Button
        </h2>
        <p className="text-muted-foreground mb-3 text-base leading-relaxed">
          <strong>What it does:</strong> Resets the editor content back to the
          original post template — including your solution code pre-filled in
          the code block. All edits you've made will be discarded.
        </p>
        <p className="text-muted-foreground text-base leading-relaxed">
          <strong>When to use it:</strong> If you've made a mess of the
          formatting and want a clean slate to start over from the default
          structure.
        </p>
      </section>

      <hr className="my-8 border-border" />

      {/* Markdown Guide Button Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">💡</span> Markdown Guide Button
        </h2>
        <p className="text-muted-foreground mb-4 text-base leading-relaxed">
          Opens this reference guide for all Markdown syntax supported in this
          editor. Use it whenever you forget a syntax or want to format your
          post more professionally.
        </p>
      </section>

      <hr className="my-8 border-border" />

      {/* Best Practices Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">✅</span> Best Practices for Writing Great
          Posts
        </h2>
        <ul className="list-disc list-outside ml-6 text-muted-foreground space-y-3 text-base leading-relaxed">
          <li>
            Use <strong>Headings</strong> to break your post into clear sections
          </li>
          <li>
            Always use <strong>Code Blocks</strong> for your solution — never
            paste raw code as plain text
          </li>
          <li>
            Use <strong>Inline Code</strong> for variable names and function
            references inside sentences
          </li>
          <li>
            Use a <strong>Table</strong> to compare approaches — e.g. brute
            force vs optimised, time vs space trade-offs
          </li>
          <li>
            Use <strong>Strikethrough</strong> to show a wrong approach you
            considered and ruled out — it shows your thinking process
          </li>
          <li>
            Use <strong>Horizontal Rules</strong> to cleanly separate major
            sections without needing an extra heading
          </li>
          <li>
            Use <strong>Nested Lists</strong> to break down complex steps — Tab
            to go deeper, Shift+Tab to come back up
          </li>
          <li>Avoid walls of text — use lists and quotes to break it up</li>
          <li>
            Fill in the <strong>Edge Cases</strong> section — it shows depth of
            thinking
          </li>
          <li>
            The <strong>Alternative Approaches</strong> section is what
            separates a good post from a great one — even one sentence helps
          </li>
          <li>
            Add a <strong>diagram or screenshot</strong> using the image upload
            button if your approach is visual (trees, graphs, two pointers etc.)
          </li>
        </ul>
      </section>

      <hr className="my-8 border-border" />

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-2xl font-semibold mb-3">Happy coding 🚀</p>
        <p className="text-muted-foreground text-base leading-relaxed">
          Markdown makes your solutions clearer, more professional, and easier
          to understand for others.
        </p>
      </div>
    </div>
  );
};

export default MarkdownGuideBox;
